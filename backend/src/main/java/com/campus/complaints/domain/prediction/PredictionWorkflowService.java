package com.campus.complaints.domain.prediction;

import com.campus.complaints.common.exception.IntegrationException;
import com.campus.complaints.domain.attachment.ComplaintAttachmentEntity;
import com.campus.complaints.domain.complaint.*;
import com.campus.complaints.domain.routing.RoutingResolution;
import com.campus.complaints.domain.routing.RoutingService;
import com.campus.complaints.domain.settings.PredictionThresholdService;
import com.campus.complaints.domain.sla.SlaService;
import com.campus.complaints.domain.user.UserEntity;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionWorkflowService {

    private final PredictionApiClient predictionApiClient;
    private final PredictionPayloadBuilder payloadBuilder;
    private final ComplaintPredictionRepository complaintPredictionRepository;
    private final ComplaintCategoryRepository complaintCategoryRepository;
    private final ComplaintAssignmentRepository complaintAssignmentRepository;
    private final RoutingService routingService;
    private final SlaService slaService;
    private final TimelineService timelineService;

    @Transactional
    public PredictionApplicationResult runAndApply(ComplaintEntity complaint,
                                                   List<ComplaintAttachmentEntity> attachments,
                                                   UserEntity actor,
                                                   double threshold) {
        try {
            PredictionResult result = predictionApiClient.predictSingle(payloadBuilder.build(complaint, attachments));
            persistPrediction(complaint, result, true);
            if (!result.success()) {
                markNeedsReview(complaint, "Prediction API returned invalid payload", actor);
                return PredictionApplicationResult.reviewRequired("Prediction parsing failed", result);
            }
            applyPredictionToComplaint(complaint, result, actor, threshold);
            return complaint.isNeedsReview()
                    ? PredictionApplicationResult.reviewRequired(complaint.getReviewReason(), result)
                    : PredictionApplicationResult.applied(result);
        } catch (IntegrationException ex) {
            log.warn("Prediction failed for complaint {}: {}", complaint.getComplaintCode(), ex.getMessage());
            PredictionResult failed = PredictionResult.failure(ex.getMessage(), null);
            persistPrediction(complaint, failed, false);
            markNeedsReview(complaint, "Prediction service unavailable", actor);
            complaint.setStatus(ComplaintStatus.NEW);
            return PredictionApplicationResult.reviewRequired("Prediction service unavailable", failed);
        }
    }

    private void persistPrediction(ComplaintEntity complaint, PredictionResult result, boolean success) {
        ComplaintPredictionEntity pred = new ComplaintPredictionEntity();
        pred.setComplaint(complaint);
        pred.setModelVersion(result.modelVersion());
        pred.setOverallConfidence(result.overallConfidence());
        pred.setSeverityScore(result.severityScore());
        pred.setRawJson(result.rawJson());
        pred.setPredictedAt(OffsetDateTime.now());
        pred.setSuccess(success && result.success());
        pred.setFailureReason(result.failureReason());
        complaintPredictionRepository.save(pred);
    }

    private void applyPredictionToComplaint(ComplaintEntity complaint, PredictionResult result, UserEntity actor, double threshold) {
        if (result.labels() == null || result.labels().isEmpty()) {
            markNeedsReview(complaint, "Prediction labels missing", actor);
            return;
        }

        List<PredictionResult.PredictedLabel> parsedLabels = result.labels().stream()
                .map(l -> new PredictionResult.PredictedLabel(l.label(), l.confidence() == null ? 0.5d : l.confidence()))
                .sorted(Comparator.comparing(PredictionResult.PredictedLabel::confidence).reversed())
                .toList();

        complaintCategoryRepository.deleteByComplaintId(complaint.getId());
        List<ComplaintCategoryEntity> categories = new ArrayList<>();
        for (int i = 0; i < parsedLabels.size(); i++) {
            PredictionResult.PredictedLabel label = parsedLabels.get(i);
            ComplaintCategoryType category = parseCategory(label.label());
            if (category == null) continue;
            ComplaintCategoryEntity entity = new ComplaintCategoryEntity();
            entity.setComplaint(complaint);
            entity.setCategory(category);
            entity.setPrimary(i == 0);
            entity.setConfidence(label.confidence());
            categories.add(complaintCategoryRepository.save(entity));
        }

        if (categories.isEmpty()) {
            markNeedsReview(complaint, "No valid categories parsed", actor);
            return;
        }

        ComplaintCategoryType primary = categories.stream().filter(ComplaintCategoryEntity::isPrimary).findFirst().map(ComplaintCategoryEntity::getCategory).orElse(null);
        double overall = result.overallConfidence() != null ? result.overallConfidence() : categories.stream().mapToDouble(c -> c.getConfidence() == null ? 0.0 : c.getConfidence()).average().orElse(0.0);
        complaint.setNeedsReview(false);
        complaint.setReviewReason(null);
        complaint.setPriority(mapPriority(result.severityScore()));
        slaService.applyInitialSla(complaint);
        timelineService.add(complaint, TimelineEventType.PREDICTION_COMPLETED, null, String.format(Locale.ROOT, "%.2f", overall), actor,
                "Prediction completed with " + categories.size() + " category labels");

        RoutingResolution routing = routingService.resolve(primary, complaint.getHostelName(), complaint.getBuildingName());
        if (!routing.resolved()) {
            markNeedsReview(complaint, routing.reason(), actor);
        } else {
            applyAssignments(complaint, routing.owner(), routing.collaborators());
        }

        if (overall < threshold) {
            markNeedsReview(complaint, "Low model confidence", actor);
        }
    }

    private void applyAssignments(ComplaintEntity complaint, UserEntity owner, List<UserEntity> collaborators) {
        complaintAssignmentRepository.deleteByComplaintId(complaint.getId());
        complaint.setOwnerUser(owner);
        ComplaintAssignmentEntity ownerAssignment = new ComplaintAssignmentEntity();
        ownerAssignment.setComplaint(complaint);
        ownerAssignment.setUser(owner);
        ownerAssignment.setAssignmentType(AssignmentType.OWNER);
        complaintAssignmentRepository.save(ownerAssignment);
        for (UserEntity collaborator : collaborators) {
            ComplaintAssignmentEntity entity = new ComplaintAssignmentEntity();
            entity.setComplaint(complaint);
            entity.setUser(collaborator);
            entity.setAssignmentType(AssignmentType.COLLABORATOR);
            complaintAssignmentRepository.save(entity);
        }
    }

    private void markNeedsReview(ComplaintEntity complaint, String reason, UserEntity actor) {
        complaint.setNeedsReview(true);
        complaint.setReviewReason(reason);
        complaint.setOwnerUser(null);
        complaintAssignmentRepository.deleteByComplaintId(complaint.getId());
        timelineService.add(complaint, TimelineEventType.REVIEW_REQUIRED, null, reason, actor, "Placed in manual review queue");
    }

    private PriorityLevel mapPriority(Double severityScore) {
        double score = severityScore == null ? 0.5 : severityScore;
        if (score > 1.0) score = score / 100.0;
        if (score >= 0.85) return PriorityLevel.CRITICAL;
        if (score >= 0.65) return PriorityLevel.HIGH;
        if (score >= 0.35) return PriorityLevel.MEDIUM;
        return PriorityLevel.LOW;
    }

    private ComplaintCategoryType parseCategory(String label) {
        if (label == null) return null;
        String normalized = label.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
        if ("HARRASHMENT".equals(normalized)) {
            normalized = "HARASSMENT";
        }
        if ("LIBRARY".equals(normalized) || "MESS".equals(normalized) || "OTHER".equals(normalized)) {
            normalized = "OTHERS";
        }
        try {
            return ComplaintCategoryType.valueOf(normalized);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }

    public record PredictionApplicationResult(boolean reviewRequired, String reviewReason, PredictionResult predictionResult) {
        public static PredictionApplicationResult applied(PredictionResult result) {
            return new PredictionApplicationResult(false, null, result);
        }
        public static PredictionApplicationResult reviewRequired(String reason, PredictionResult result) {
            return new PredictionApplicationResult(true, reason, result);
        }
    }
}
