package com.campus.complaints.domain.complaint;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintTimelineRepository extends JpaRepository<ComplaintTimelineEntity, Long> {
    List<ComplaintTimelineEntity> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
}
