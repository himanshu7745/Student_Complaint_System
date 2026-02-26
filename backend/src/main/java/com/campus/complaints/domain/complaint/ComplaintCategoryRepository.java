package com.campus.complaints.domain.complaint;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintCategoryRepository extends JpaRepository<ComplaintCategoryEntity, Long> {
    List<ComplaintCategoryEntity> findByComplaintIdOrderByPrimaryDescConfidenceDesc(Long complaintId);
    void deleteByComplaintId(Long complaintId);
}
