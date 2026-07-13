package com.styleme.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class ImageGenerationService {

    private static final Logger log = LoggerFactory.getLogger(ImageGenerationService.class);

    public static final String OPENAI_EDIT_MODEL = "gpt-image-1";
    public static final String OPENAI_EDIT_SIZE = "1024x1024";
    public static final String OPENAI_EDIT_QUALITY = "high";
    public static final String OPENAI_EDIT_ENDPOINT = "https://api.openai.com/v1/images/edits";
    public static final int PREVIEW_IMAGE_COUNT = 3;

    private static final Pattern NON_HAIR_SENTENCE =
            Pattern.compile("(?i).*(\\b(taller|shorter|height|body|weight|muscular|muscles|thinner|slimmer|skinny|fat)\\b"
                    + "|\\b(shirt|clothing|clothes|outfit|dress|jacket|pants|trousers|jeans|suit|tie|blouse|top|wear|wardrobe)\\b"
                    + "|\\b(background|scenery|room|sky|beach|office|studio backdrop|wallpaper)\\b"
                    + "|\\b(face shape|jawline|jaw line|cheekbones|nose|lips|eyes|eyebrows|forehead|chin|face slim|slim face|reshape face)\\b"
                    + "|\\b(beautify|prettier|prettiest|handsome|younger|older|age|ethnicity|makeup|lipstick|contour)\\b"
                    + "|\\b(cartoon|anime|illustration|illustrated|stylized|painting|sketch|3d render)\\b).*");

    private static final Pattern NON_HAIR_PHRASE = Pattern.compile(
            "(?i)\\b(and\\s+)?(make me|change my|give me|put me in|switch my|replace my)\\s+"
                    + "(taller|shorter|a different shirt|different clothes|new outfit|the background|my face|my jaw|my nose|my body)\\b[^.!?;]*[.!?;]?");

    private static final Pattern HAIR_HINT =
            Pattern.compile("(?i)\\b(hair|hairstyle|bangs|fringe|layers?|volume|curl|curly|straight|wavy|bob|pixie|lob|cut|length|trim|fade|part|texture|shag|bun|ponytail|braid|updo|highlights?|color|colour|perm|blowout|undercut|mullet|bixie)\\b");

    private static final String[] STYLE_VARIATIONS = {
            "",
            " with a slightly softer, more layered interpretation",
            " with a slightly bolder, more textured interpretation",
    };

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String openAiApiKey;

    public ImageGenerationService(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper,
            @Value("${openai.api-key:}") String openAiApiKey
    ) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
        this.openAiApiKey = openAiApiKey == null ? "" : openAiApiKey.trim();
    }

    public record SessionSetup(
            String gender,
            String occasion,
            String hairLengthPref,
            String hairGoal
    ) {}

    public record StyleIdea(String title, String description) {}

    public record SessionContext(
            String faceShape,
            String prompt,
            String selectedStylePill,
            SessionSetup setup,
            List<StyleIdea> ideas
    ) {}

    /**
     * Strips non-hair instructions from free-text user input before prompt insertion.
     */
    public String sanitizeStyleRequest(String userInput) {
        if (userInput == null || userInput.isBlank()) {
            return "";
        }

        String cleaned = userInput.trim();
        cleaned = NON_HAIR_PHRASE.matcher(cleaned).replaceAll(" ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        String[] sentences = cleaned.split("(?<=[.!?;])\\s+");
        List<String> kept = new ArrayList<>();
        for (String sentence : sentences) {
            String part = sentence.trim();
            if (part.isEmpty()) {
                continue;
            }
            if (NON_HAIR_SENTENCE.matcher(part).matches()) {
                continue;
            }
            if (!HAIR_HINT.matcher(part).find() && part.split("\\s+").length <= 3) {
                // Drop short fragments with no hair vocabulary (e.g. "make me taller").
                continue;
            }
            kept.add(part);
        }

        String result = String.join(" ", kept).trim();
        if (result.length() > 400) {
            result = result.substring(0, 400).trim();
        }
        return result;
    }

    public String resolveStyleRequest(SessionContext ctx) {
        List<String> parts = new ArrayList<>();
        if (ctx.selectedStylePill() != null && !ctx.selectedStylePill().isBlank()) {
            parts.add(ctx.selectedStylePill().trim());
        }

        String sanitizedPrompt = sanitizeStyleRequest(ctx.prompt());
        if (!sanitizedPrompt.isBlank()) {
            parts.add(sanitizedPrompt);
        }

        String combined = String.join(". ", parts).trim();
        if (!combined.isBlank() && !isVagueStyleRequest(combined)) {
            return combined;
        }
        return buildFallbackStyleRequest(ctx.faceShape(), ctx.setup().gender());
    }

    public String buildEditPrompt(String sanitizedStyleRequest, int variationIndex) {
        int idx = Math.floorMod(variationIndex, STYLE_VARIATIONS.length);
        String variation = STYLE_VARIATIONS[idx];
        return "Edit this photo. Keep the person's face, skin tone, and identity exactly the same — do not beautify or alter any facial feature. "
                + "Change ONLY the hairstyle to: " + sanitizedStyleRequest + variation + ". "
                + "Keep the result photorealistic.";
    }

    public List<String> buildPromptsForSession(SessionContext ctx) {
        String styleRequest = resolveStyleRequest(ctx);
        List<String> prompts = new ArrayList<>(PREVIEW_IMAGE_COUNT);
        for (int i = 0; i < PREVIEW_IMAGE_COUNT; i++) {
            prompts.add(buildEditPrompt(styleRequest, i));
        }
        return prompts;
    }

    public List<byte[]> generatePreviewImages(Path photoFile, SessionContext ctx) throws IOException {
        if (openAiApiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is not configured.");
        }
        if (photoFile == null || !Files.isRegularFile(photoFile)) {
            throw new IllegalArgumentException("Session photo file is missing.");
        }

        byte[] photoBytes = Files.readAllBytes(photoFile);
        String filename = photoFile.getFileName().toString();
        String contentType = filename.toLowerCase(Locale.ROOT).endsWith(".png")
                ? MediaType.IMAGE_PNG_VALUE
                : MediaType.IMAGE_JPEG_VALUE;

        List<String> prompts = buildPromptsForSession(ctx);
        List<byte[]> images = new ArrayList<>(prompts.size());
        for (String prompt : prompts) {
            images.add(callOpenAiImageEdit(photoBytes, filename, contentType, prompt));
        }
        return images;
    }

    private byte[] callOpenAiImageEdit(
            byte[] photoBytes,
            String filename,
            String contentType,
            String prompt
    ) throws IOException {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("model", OPENAI_EDIT_MODEL);
        bodyBuilder.part("image", new ByteArrayResource(photoBytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        }).contentType(MediaType.parseMediaType(contentType));
        bodyBuilder.part("prompt", prompt);
        bodyBuilder.part("size", OPENAI_EDIT_SIZE);
        bodyBuilder.part("quality", OPENAI_EDIT_QUALITY);

        try {
            String responseBody = webClient.post()
                    .uri(OPENAI_EDIT_ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + openAiApiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            return decodeImageFromOpenAiResponse(responseBody);
        } catch (WebClientResponseException ex) {
            String detail = truncate(ex.getResponseBodyAsString(), 250);
            log.warn("OpenAI edit HTTP error {}: {}", ex.getStatusCode().value(), detail);
            throw new IOException("OpenAI edit failed (" + ex.getStatusCode().value() + "): " + detail, ex);
        } catch (IOException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("OpenAI edit request failed: {} - {}", ex.getClass().getSimpleName(), ex.getMessage());
            throw new IOException("OpenAI edit request failed: " + ex.getMessage(), ex);
        }
    }

    byte[] decodeImageFromOpenAiResponse(String responseBody) throws IOException {
        if (responseBody == null || responseBody.isBlank()) {
            throw new IOException("OpenAI returned an empty response body.");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(responseBody);
        } catch (Exception ex) {
            log.warn("OpenAI response JSON parse failed: {}", truncate(responseBody, 200));
            throw new IOException("OpenAI returned invalid JSON.", ex);
        }

        JsonNode data = root.path("data");
        if (!data.isArray() || data.isEmpty()) {
            JsonNode error = root.path("error");
            String errorDetail = error.isMissingNode()
                    ? truncate(responseBody, 200)
                    : truncate(error.toString(), 200);
            log.warn("OpenAI returned no image data: {}", errorDetail);
            throw new IOException("OpenAI returned no image data. " + errorDetail);
        }

        JsonNode first = data.path(0);
        String b64 = first.path("b64_json").asText("");
        if (!b64.isBlank()) {
            return Base64.getDecoder().decode(b64);
        }

        String url = first.path("url").asText("");
        if (!url.isBlank()) {
            try {
                byte[] downloaded = webClient.get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(byte[].class)
                        .block();
                if (downloaded == null || downloaded.length == 0) {
                    throw new IOException("Failed to download generated image URL.");
                }
                return downloaded;
            } catch (WebClientResponseException ex) {
                String detail = truncate(ex.getResponseBodyAsString(), 250);
                log.warn("OpenAI image URL download failed {}: {}", ex.getStatusCode().value(), detail);
                throw new IOException("Failed to download generated image URL (" + ex.getStatusCode().value() + "): " + detail, ex);
            } catch (Exception ex) {
                log.warn("OpenAI image URL download failed: {} - {}", ex.getClass().getSimpleName(), ex.getMessage());
                throw new IOException("Failed to download generated image URL: " + ex.getMessage(), ex);
            }
        }

        throw new IOException("OpenAI response missing b64_json/url.");
    }

    private static String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        if (value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    private boolean isVagueStyleRequest(String request) {
        String normalized = request.toLowerCase(Locale.ROOT);
        return normalized.equals("hair")
                || normalized.equals("hairstyle")
                || normalized.equals("new hairstyle")
                || normalized.equals("change hair")
                || normalized.equals("different hair");
    }

    private String buildFallbackStyleRequest(String faceShape, String gender) {
        String shape = blankToDefault(faceShape, "oval").toLowerCase(Locale.ROOT);
        boolean malePresentation = isMalePresentation(gender);

        return switch (shape) {
            case "round" -> malePresentation
                    ? "textured crop with height on top to add length"
                    : "long layers with soft face-framing pieces";
            case "square" -> malePresentation
                    ? "textured quiff with softer edges"
                    : "soft lob with gentle waves";
            case "heart" -> "chin-length bob with light bangs and face-framing layers";
            case "oblong" -> "shoulder-length cut with fuller sides and soft volume";
            default -> malePresentation
                    ? "clean medium-length cut with natural texture"
                    : "soft layered lob with natural movement";
        };
    }

    private boolean isMalePresentation(String gender) {
        if (gender == null || gender.isBlank()) {
            return false;
        }
        String normalized = gender.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("man") || normalized.equals("male");
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
