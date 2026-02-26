package com.campus.complaints.domain.complaint;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintAssignmentRepository extends JpaRepository<ComplaintAssignmentEntity, Long> {
    List<ComplaintAssignmentEntity> findByComplaintId(Long complaintId);
    void deleteByComplaintId(Long complaintId);
    List<ComplaintAssignmentEntity> findByUserIdAndAssignmentType(Long userId, AssignmentType assignmentType);
}
