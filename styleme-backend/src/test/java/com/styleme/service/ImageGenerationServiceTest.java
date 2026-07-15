package com.styleme.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageGenerationServiceTest {

    private final ImageGenerationService service = new ImageGenerationService(
            org.springframework.web.reactive.function.client.WebClient.builder(),
            new com.fasterxml.jackson.databind.ObjectMapper(),
            ""
    );

    private ImageGenerationService.SessionContext sampleContext(String prompt, String pill) {
        return new ImageGenerationService.SessionContext(
                "Oval",
                prompt,
                pill,
                new ImageGenerationService.SessionSetup("Woman", "Work / everyday", "Medium", "More volume"),
                List.of()
        );
    }

    @Test
    void sanitizeStyleRequest_stripsUnrelatedInstructions() {
        String raw = "soft layers around the jaw, make me taller, and change my shirt to blue";
        String sanitized = service.sanitizeStyleRequest(raw);

        assertTrue(sanitized.toLowerCase().contains("soft layers"));
        assertFalse(sanitized.toLowerCase().contains("taller"));
        assertFalse(sanitized.toLowerCase().contains("shirt"));
    }

    @Test
    void sanitizeStyleRequest_dropsPurelyUnrelatedInput() {
        String sanitized = service.sanitizeStyleRequest("make me taller and change my shirt");
        assertEquals("", sanitized);
    }

    @Test
    void buildEditPrompt_enforcesIdentityPreservationTemplate() {
        String prompt = service.buildEditPrompt("soft layered lob with face-framing pieces", 0);

        assertTrue(prompt.startsWith("Edit the uploaded photo by changing ONLY the hairstyle."));
        assertTrue(prompt.contains("Preserve the person's identity exactly"));
        assertTrue(prompt.contains("Keep the face, skin tone, beard, mustache, expression, clothing, lighting, pose, camera angle, background and framing identical to the original image"));
        assertTrue(prompt.contains("Only replace the hairstyle with a realistic soft layered lob with face-framing pieces"));
        assertTrue(prompt.contains("Do not beautify, retouch, enhance, regenerate or alter the face"));
        assertTrue(prompt.contains("naturally blend into the forehead, temples, sideburns, ears, and neckline"));
        assertTrue(prompt.contains("Avoid floating hair, fake wigs, blurry edges, mismatched hairlines, and unrealistic volume"));
        assertTrue(prompt.contains("The final result should look like the same person after getting a haircut at a professional salon"));
    }

    @Test
    void sanitizeStyleRequest_stripsBeautyEnhancementRequests() {
        String raw = "soft layers, smooth my skin, whiten my teeth, and enlarge my eyes";
        String sanitized = service.sanitizeStyleRequest(raw);

        assertTrue(sanitized.toLowerCase().contains("soft layers"));
        assertFalse(sanitized.toLowerCase().contains("smooth"));
        assertFalse(sanitized.toLowerCase().contains("teeth"));
        assertFalse(sanitized.toLowerCase().contains("enlarge"));
    }

    @Test
    void sanitizeStyleRequest_stripsSceneAndWardrobeRequests() {
        String raw = "soft waves, brighter lighting, change my shirt, and remove my glasses";
        String sanitized = service.sanitizeStyleRequest(raw);

        assertTrue(sanitized.toLowerCase().contains("soft waves"));
        assertFalse(sanitized.toLowerCase().contains("lighting"));
        assertFalse(sanitized.toLowerCase().contains("shirt"));
        assertFalse(sanitized.toLowerCase().contains("glasses"));
    }

    @Test
    void sanitizeStyleRequest_stripsFacialGroomingAndExpressionRequests() {
        String raw = "soft layers, trim my beard, whiten my teeth, and look happier";
        String sanitized = service.sanitizeStyleRequest(raw);

        assertTrue(sanitized.toLowerCase().contains("soft layers"));
        assertFalse(sanitized.toLowerCase().contains("beard"));
        assertFalse(sanitized.toLowerCase().contains("teeth"));
        assertFalse(sanitized.toLowerCase().contains("happier"));
    }

    @Test
    void buildPromptsForSession_returnsFourDistinctVariations() {
        ImageGenerationService.SessionContext ctx = sampleContext("wavy shoulder-length cut", "Soft layers");
        List<String> prompts = service.buildPromptsForSession(ctx);

        assertEquals(ImageGenerationService.PREVIEW_IMAGE_COUNT, prompts.size());
        assertTrue(prompts.get(0).contains("wavy shoulder-length cut"));
        assertTrue(prompts.get(1).contains("slightly softer, more layered interpretation"));
        assertTrue(prompts.get(2).contains("slightly bolder, more textured interpretation"));
        assertTrue(prompts.get(3).contains("slightly more polished, salon-finished interpretation"));
    }

    @Test
    void resolveStyleRequest_fallsBackWhenInputIsVague() {
        ImageGenerationService.SessionContext ctx = sampleContext("", null);
        String resolved = service.resolveStyleRequest(ctx);

        assertTrue(resolved.toLowerCase().contains("lob"));
    }

    @Test
    void resolveStyleRequest_prefersSanitizedUserInputOverFallback() {
        ImageGenerationService.SessionContext ctx = sampleContext(
                "keep length, add soft bangs, make me taller",
                "Sleek and polished"
        );
        String resolved = service.resolveStyleRequest(ctx);

        assertTrue(resolved.contains("Sleek and polished"));
        assertTrue(resolved.toLowerCase().contains("bangs"));
        assertFalse(resolved.toLowerCase().contains("taller"));
    }
}
