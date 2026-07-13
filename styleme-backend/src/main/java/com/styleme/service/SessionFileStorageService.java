package com.styleme.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class SessionFileStorageService {

    private final Path uploadRoot;

    public SessionFileStorageService(@Value("${styleme.upload-dir:uploads}") String uploadDir) throws IOException {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadRoot);
    }

    public Path saveSessionPhoto(UUID sessionId, MultipartFile photo) throws IOException {
        Path sessionDir = sessionDir(sessionId);
        Files.createDirectories(sessionDir);

        String original = photo.getOriginalFilename();
        String ext = ".jpg";
        if (original != null && original.toLowerCase().endsWith(".png")) {
            ext = ".png";
        }

        Path target = sessionDir.resolve("photo" + ext);
        Files.copy(photo.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return target;
    }

    public Path saveGeneratedImage(UUID sessionId, int index, byte[] imageBytes) throws IOException {
        Path sessionDir = sessionDir(sessionId);
        Files.createDirectories(sessionDir);
        Path target = sessionDir.resolve("generated-" + index + ".png");
        Files.write(target, imageBytes);
        return target;
    }

    public Path resolveStoredPhoto(String photoUrl) {
        if (photoUrl == null || photoUrl.isBlank()) {
            return null;
        }
        return uploadRoot.resolve(photoUrl).normalize();
    }

    public String toRelativePath(Path absolutePath) {
        Path normalized = absolutePath.toAbsolutePath().normalize();
        return uploadRoot.relativize(normalized).toString().replace('\\', '/');
    }

    private Path sessionDir(UUID sessionId) {
        return uploadRoot.resolve("sessions").resolve(sessionId.toString());
    }
}
