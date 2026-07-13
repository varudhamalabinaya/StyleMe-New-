package com.styleme.dto;

import java.util.List;
import java.util.UUID;

public final class ApiResponses {

    private ApiResponses() {
    }

    public record CreateSessionResponse(UUID id) {
    }

    public record GenerateImagesResponse(List<String> images, int count) {
    }

    public record ErrorResponse(String error) {
    }
}
