package com.styleme.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.styleme.entity.StyleSession;
import com.styleme.repository.StyleSessionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class StyleSessionService {

    private final StyleSessionRepository repository;
    private final SessionFileStorageService fileStorage;
    private final ImageGenerationService imageGenerationService;
    private final ObjectMapper objectMapper;
    private final String publicBaseUrl;

    public StyleSessionService(
            StyleSessionRepository repository,
            SessionFileStorageService fileStorage,
            ImageGenerationService imageGenerationService,
            ObjectMapper objectMapper,
            @Value("${styleme.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.repository = repository;
        this.fileStorage = fileStorage;
        this.imageGenerationService = imageGenerationService;
        this.objectMapper = objectMapper;
        this.publicBaseUrl = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;
    }

    public StyleSession createSession(
            MultipartFile photo,
            String gender,
            String occasion,
            String hairLength,
            String goal,
            String faceShape,
            String userPrompt,
            String stylePill
    ) throws IOException {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("photo file is required");
        }

        StyleSession session = new StyleSession();
        session.setGender(gender);
        session.setOccasion(occasion);
        session.setHairLength(hairLength);
        session.setGoal(goal);
        session.setFaceShape(faceShape);
        session.setUserPrompt(userPrompt);
        session.setStylePill(stylePill);

        StyleSession saved = repository.save(session);
        Path photoPath = fileStorage.saveSessionPhoto(saved.getId(), photo);
        saved.setPhotoUrl(fileStorage.toRelativePath(photoPath));
        return repository.save(saved);
    }

    public StyleSession requireSession(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + id));
    }

    public List<String> generatePreviewImages(UUID sessionId) throws IOException {
        StyleSession session = requireSession(sessionId);
        Path photoPath = fileStorage.resolveStoredPhoto(session.getPhotoUrl());
        if (photoPath == null || !Files.isRegularFile(photoPath)) {
            throw new IllegalArgumentException("Session photo is missing for id: " + sessionId);
        }

        ImageGenerationService.SessionContext ctx = toSessionContext(session);
        List<byte[]> generated = imageGenerationService.generatePreviewImages(photoPath, ctx);

        List<String> imageUrls = new ArrayList<>(generated.size());
        for (int i = 0; i < generated.size(); i++) {
            Path saved = fileStorage.saveGeneratedImage(sessionId, i + 1, generated.get(i));
            String relative = fileStorage.toRelativePath(saved);
            imageUrls.add(publicBaseUrl + "/uploads/" + relative);
        }

        session.setGeneratedImageUrls(writeUrlsJson(imageUrls));
        repository.save(session);
        return imageUrls;
    }

    private ImageGenerationService.SessionContext toSessionContext(StyleSession session) {
        ImageGenerationService.SessionSetup setup = new ImageGenerationService.SessionSetup(
                session.getGender(),
                session.getOccasion(),
                session.getHairLength(),
                session.getGoal()
        );
        return new ImageGenerationService.SessionContext(
                session.getFaceShape(),
                session.getUserPrompt(),
                session.getStylePill(),
                setup,
                List.of()
        );
    }

    private String writeUrlsJson(List<String> urls) {
        try {
            return objectMapper.writeValueAsString(urls);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize generated image URLs", ex);
        }
    }
}
