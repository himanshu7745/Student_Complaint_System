package com.campus.complaints.domain.prediction;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintPredictionRepository extends JpaRepository<ComplaintPredictionEntity, Long> {
    Optional<ComplaintPredictionEntity> findTopByComplaintIdOrderByPredictedAtDesc(Long complaintId);
}
