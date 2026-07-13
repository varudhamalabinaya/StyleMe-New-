package com.styleme.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "style_sessions")
public class StyleSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String gender;
    private String occasion;

    @Column(name = "hair_length")
    private String hairLength;

    private String goal;

    @Column(name = "face_shape")
    private String faceShape;

    @Column(name = "user_prompt")
    private String userPrompt;

    @Column(name = "style_pill")
    private String stylePill;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "generated_image_urls", columnDefinition = "TEXT")
    private String generatedImageUrls;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String occasion) {
        this.occasion = occasion;
    }

    public String getHairLength() {
        return hairLength;
    }

    public void setHairLength(String hairLength) {
        this.hairLength = hairLength;
    }

    public String getGoal() {
        return goal;
    }

    public void setGoal(String goal) {
        this.goal = goal;
    }

    public String getFaceShape() {
        return faceShape;
    }

    public void setFaceShape(String faceShape) {
        this.faceShape = faceShape;
    }

    public String getUserPrompt() {
        return userPrompt;
    }

    public void setUserPrompt(String userPrompt) {
        this.userPrompt = userPrompt;
    }

    public String getStylePill() {
        return stylePill;
    }

    public void setStylePill(String stylePill) {
        this.stylePill = stylePill;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getGeneratedImageUrls() {
        return generatedImageUrls;
    }

    public void setGeneratedImageUrls(String generatedImageUrls) {
        this.generatedImageUrls = generatedImageUrls;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
