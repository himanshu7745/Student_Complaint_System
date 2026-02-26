package com.codex.scms.repository;

import com.codex.scms.domain.entity.ComplaintEvent;
import com.codex.scms.domain.enums.ComplaintEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintEventRepository extends JpaRepository<ComplaintEvent, UUID> {
    List<ComplaintEvent> findByComplaint_IdOrderByCreatedAtAsc(UUID complaintId);
    boolean existsByComplaint_IdAndEventTypeAndMessageContaining(UUID complaintId, ComplaintEventType eventType, String messageFragment);
}
