package com.campus.complaints.domain.sla;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EscalationRepository extends JpaRepository<EscalationEntity, Long> {
    boolean existsByComplaintIdAndLevel(Long complaintId, EscalationLevel level);
    List<EscalationEntity> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
