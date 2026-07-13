package com.styleme.repository;

import com.styleme.entity.StyleSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StyleSessionRepository extends JpaRepository<StyleSession, UUID> {
}
