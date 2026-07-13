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

        assertTrue(prompt.startsWith("Edit this photo."));
        assertTrue(prompt.contains("Keep the person's face, skin tone, and identity exactly the same"));
        assertTrue(prompt.contains("do not beautify or alter any facial feature"));
        assertTrue(prompt.contains("Change ONLY the hairstyle to: soft layered lob with face-framing pieces"));
        assertTrue(prompt.contains("Keep the result photorealistic."));
    }

    @Test
    void buildPromptsForSession_returnsThreeDistinctVariations() {
        ImageGenerationService.SessionContext ctx = sampleContext("wavy shoulder-length cut", "Soft layers");
        List<String> prompts = service.buildPromptsForSession(ctx);

        assertEquals(3, prompts.size());
        assertTrue(prompts.get(0).contains("wavy shoulder-length cut"));
        assertTrue(prompts.get(1).contains("slightly softer, more layered interpretation"));
        assertTrue(prompts.get(2).contains("slightly bolder, more textured interpretation"));
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
