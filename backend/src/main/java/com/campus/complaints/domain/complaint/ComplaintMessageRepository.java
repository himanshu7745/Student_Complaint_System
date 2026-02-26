package com.campus.complaints.domain.complaint;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintMessageRepository extends JpaRepository<ComplaintMessageEntity, Long> {
    List<ComplaintMessageEntity> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
