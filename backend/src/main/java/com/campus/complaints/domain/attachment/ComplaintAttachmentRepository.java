package com.campus.complaints.domain.attachment;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintAttachmentRepository extends JpaRepository<ComplaintAttachmentEntity, Long> {
    List<ComplaintAttachmentEntity> findByComplaintIdOrderByCreatedAtAsc(Long complaintId);
    Optional<ComplaintAttachmentEntity> findByIdAndComplaintId(Long id, Long complaintId);
    List<ComplaintAttachmentEntity> findByComplaintIdIsNullAndUploaderId(Long uploaderId);
}
