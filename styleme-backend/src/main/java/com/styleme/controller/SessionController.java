package com.styleme.controller;

import com.styleme.dto.ApiResponses.CreateSessionResponse;
import com.styleme.dto.ApiResponses.ErrorResponse;
import com.styleme.dto.ApiResponses.GenerateImagesResponse;
import com.styleme.entity.StyleSession;
import com.styleme.service.StyleSessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final StyleSessionService sessionService;

    public SessionController(StyleSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createSession(
            @RequestParam("photo") MultipartFile photo,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "occasion", required = false) String occasion,
            @RequestParam(value = "hairLength", required = false) String hairLength,
            @RequestParam(value = "goal", required = false) String goal,
            @RequestParam(value = "faceShape", required = false) String faceShape,
            @RequestParam(value = "userPrompt", required = false) String userPrompt,
            @RequestParam(value = "stylePill", required = false) String stylePill
    ) {
        System.out.println("[StyleMe API] POST /api/sessions photo=" + (photo != null ? photo.getSize() : 0) + " bytes");
        try {
            StyleSession session = sessionService.createSession(
                    photo,
                    gender,
                    occasion,
                    hairLength,
                    goal,
                    faceShape,
                    userPrompt,
                    stylePill
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(new CreateSessionResponse(session.getId()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<?> generateImages(@PathVariable UUID id, HttpServletRequest request) {
        String requestBaseUrl = ServletUriComponentsBuilder.fromRequest(request)
                .replacePath(null)
                .build()
                .toUriString();
        System.out.println("[StyleMe API] POST /api/sessions/" + id + "/generate requestBaseUrl=" + requestBaseUrl);
        try {
            List<String> images = sessionService.generatePreviewImages(id, requestBaseUrl);
            System.out.println("[StyleMe API] generate images returned (" + images.size() + "): " + images);
            return ResponseEntity.ok(new GenerateImagesResponse(images, images.size()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }
}
