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
    // gpt-image-1 only supports 1024x1024, 1024x1536, and 1536x1024; 1024x1024 is the
    // lowest-cost square size and is sufficient for mobile preview cards (~160px tall).
    public static final String OPENAI_EDIT_SIZE = "1024x1024";
    // "low" is the cheapest gpt-image-1 quality tier (~$0.011 vs ~$0.167 per 1024² edit).
    // Previews are small on-device thumbnails, so low quality is an acceptable cost/quality tradeoff.
    public static final String OPENAI_EDIT_QUALITY = "low";
    public static final String OPENAI_EDIT_ENDPOINT = "https://api.openai.com/v1/images/edits";
    public static final int PREVIEW_IMAGE_COUNT = 4;

    private static final Pattern NON_HAIR_SENTENCE =
            Pattern.compile("(?i).*(\\b(taller|shorter|height|body|weight|muscular|muscles|thinner|slimmer|skinny|fat)\\b"
                    + "|\\b(shirt|clothing|clothes|outfit|dress|jacket|pants|trousers|jeans|suit|tie|blouse|top|wear|wardrobe)\\b"
                    + "|\\b(accessories|jewelry|jewellery|earrings?|necklace|bracelet|ring|glasses|sunglasses|watch|hat|cap)\\b"
                    + "|\\b(background|scenery|room|sky|beach|office|studio backdrop|wallpaper)\\b"
                    + "|\\b(lighting|shadows?|exposure|white balance|brighter|darker|golden hour|studio light)\\b"
                    + "|\\b(pose|posture|stance|standing|sitting|leaning|crossed arms|hand position)\\b"
                    + "|\\b(face shape|jawline|jaw line|cheekbones|nose|lips|eyes|eyebrows|forehead|chin|face slim|slim face|reshape face)\\b"
                    + "|\\b(beard|mustache|moustache|stubble|goatee|facial hair|sideburns)\\b"
                    + "|\\b(teeth|smile|grin|whiten)\\b"
                    + "|\\b(expression|smirk|frown|look happier|look serious)\\b"
                    + "|\\b(head angle|tilt head|turn head|camera angle|camera perspective|perspective|zoom|crop face)\\b"
                    + "|\\b(skin texture|smooth skin|retouch|airbrush|blemish|wrinkle|acne|pimples?|clear skin)\\b"
                    + "|\\b(enlarge eyes|bigger eyes|whiten teeth|facial symmetry|symmetrical face)\\b"
                    + "|\\b(sharpen features|define jaw|improve symmetry|perfect face)\\b"
                    + "|\\b(beard density|thicker beard|thinner beard|fill in beard|alter facial hair)\\b"
                    + "|\\b(beautify|prettier|prettiest|handsome|younger|older|age|ethnicity|makeup|lipstick|contour|beauty filter)\\b"
                    + "|\\b(cartoon|anime|illustration|illustrated|stylized|painting|sketch|3d render)\\b).*");

    private static final Pattern NON_HAIR_PHRASE = Pattern.compile(
            "(?i)\\b(and\\s+)?(make me|change my|give me|put me in|switch my|replace my|fix my|reshape my|slim my)\\s+"
                    + "(taller|shorter|a different shirt|different clothes|new outfit|the background|my face|my jaw|my nose|my body|my beard|my mustache|my teeth|my smile|my expression|my skin|my pose|my lighting|my accessories|my acne|my eyes)\\b[^.!?;]*[.!?;]?");

    private static final Pattern HAIR_HINT =
            Pattern.compile("(?i)\\b(hair|hairstyle|bangs|fringe|layers?|volume|curl|curly|straight|wavy|waves?|bob|pixie|lob|cut|length|trim|fade|part|texture|shag|bun|ponytail|braid|updo|highlights?|color|colour|perm|blowout|undercut|mullet|bixie)\\b");

    private static final String HAIR_QUALITY_RULES =
            "Hair must naturally blend into the forehead, temples, sideburns, ears, and neckline with clean, believable transitions. "
                    + "Avoid floating hair, fake wigs, blurry edges, mismatched hairlines, and unrealistic volume.";

    private static final String[] STYLE_VARIATIONS = {
            "",
            " with a slightly softer, more layered interpretation",
            " with a slightly bolder, more textured interpretation",
            " with a slightly more polished, salon-finished interpretation",
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

        String[] clauses = cleaned.split("(?<=[.!?;])\\s+|,\\s*");
        List<String> kept = new ArrayList<>();
        for (String clause : clauses) {
            String part = clause.trim();
            if (part.isEmpty()) {
                continue;
            }
            // Drop leading "and" from comma-separated fragments.
            part = part.replaceFirst("(?i)^and\\s+", "").trim();
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
        String styleName = sanitizedStyleRequest + STYLE_VARIATIONS[idx];
        return "HAIRSTYLE-ONLY EDIT — identity preservation is the highest priority. "
                + "Edit the uploaded photo by changing ONLY the hair. Nothing else may change. "
                + "The ONLY editable region is the HAIR on the head. "
                + "Only replace the hairstyle with a realistic " + styleName + ". "
                + "Preserve the person's identity exactly — the output must look like the exact same person after a haircut. "
                + "Everything below the hairline and all non-hair regions must remain identical to the original image. "
                + "Do NOT modify face shape, jawline, cheeks, nose, lips, eyes, eyebrows, beard, mustache, skin tone, skin texture, wrinkles, freckles, smile, or facial expression. "
                + "Do NOT modify lighting, background, clothing, accessories, camera angle, or framing. "
                + "Explicitly forbidden: beautification, portrait enhancement, skin smoothing, face regeneration, facial retouching, symmetry enhancement, eye enlargement, and teeth whitening. "
                + "Do not beautify, retouch, enhance, regenerate, reshape, or alter the face in any way. "
                + HAIR_QUALITY_RULES + " "
                + "The final result should look like the exact same person after getting a haircut at a professional salon — only the hairstyle changes.";
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
