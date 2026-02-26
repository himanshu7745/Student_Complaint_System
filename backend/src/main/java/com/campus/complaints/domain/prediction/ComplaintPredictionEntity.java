package com.campus.complaints.domain.prediction;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaint_predictions")
public class ComplaintPredictionEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private ComplaintEntity complaint;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "overall_confidence")
    private Double overallConfidence;

    @Column(name = "severity_score")
    private Double severityScore;

    @Column(name = "raw_json", columnDefinition = "text")
    private String rawJson;

    @Column(name = "predicted_at", nullable = false)
    private OffsetDateTime predictedAt;

    @Column(nullable = false)
    private boolean success = true;

    @Column(name = "failure_reason")
    private String failureReason;
}
