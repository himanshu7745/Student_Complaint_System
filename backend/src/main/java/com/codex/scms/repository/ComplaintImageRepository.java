package com.codex.scms.repository;

import com.codex.scms.domain.entity.ComplaintImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ComplaintImageRepository extends JpaRepository<ComplaintImage, UUID> {
}
