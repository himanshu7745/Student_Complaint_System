package com.campus.complaints.domain.complaint.api;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

public final class ComplaintDtos {
    private ComplaintDtos() {}

    public record ComplaintCategoryDTO(String category, boolean primary, Double confidence) {}
    public record LabelConfidenceDTO(String label, Double confidence) {}
    public record PredictionDTO(String modelVersion, Double overallConfidence, Double severityScore, List<LabelConfidenceDTO> labels,
                                boolean predictionFailed, String failureReason, OffsetDateTime predictedAt) {}
    public record UserRefDTO(Long id, String name, String email, String role, String department) {}
    public record AssignmentDTO(UserRefDTO owner, List<UserRefDTO> collaborators) {}
    public record LocationDTO(String hostel, String building, String room) {}
    public record AttachmentDTO(Long id, String fileName, String mimeType, Long size, String url, Long uploaderId, String uploaderName,
                                OffsetDateTime createdAt) {}
    public record MessageDTO(Long id, Long complaintId, UserRefDTO sender, String message, boolean internal, OffsetDateTime createdAt) {}
    public record TimelineEventDTO(Long id, String eventType, String oldValue, String newValue, String detail, UserRefDTO actor,
                                   OffsetDateTime createdAt) {}
    public record SlaDTO(OffsetDateTime acknowledgeDueAt, OffsetDateTime resolveDueAt, boolean acknowledgeOverdue, boolean resolveOverdue) {}
    public record ComplaintListItemDTO(
            String id,
            String title,
            String status,
            String priority,
            boolean needsReview,
            String reviewReason,
            LocationDTO location,
            List<ComplaintCategoryDTO> categories,
            PredictionDTO prediction,
            AssignmentDTO assignments,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            SlaDTO sla
    ) {}
    public record ComplaintDetailDTO(
            String id,
            String title,
            String description,
            String status,
            String priority,
            boolean anonymous,
            boolean needsReview,
            String reviewReason,
            Integer reopenedCount,
            LocationDTO location,
            String preferredVisitSlot,
            List<ComplaintCategoryDTO> categories,
            PredictionDTO prediction,
            AssignmentDTO assignments,
            SlaDTO sla,
            Integer feedbackRating,
            String feedbackComment,
            OffsetDateTime resolvedAt,
            OffsetDateTime closedAt,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            List<AttachmentDTO> attachments,
            List<MessageDTO> messages,
            List<TimelineEventDTO> timeline,
            List<TimelineEventDTO> auditLog
    ) {}

    public record CreateComplaintRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(min = 20, max = 5000) String description,
            @Size(max = 200) String hostel,
            @NotBlank @Size(max = 200) String building,
            @NotBlank @Size(max = 200) String room,
            @Size(max = 255) String preferredVisitSlot,
            Boolean anonymous,
            List<Long> attachmentIds
    ) {}

    public record UpdateComplaintRequest(
            @Size(max = 200) String title,
            @Size(min = 20, max = 5000) String description,
            @Size(max = 200) String hostel,
            @Size(max = 200) String building,
            @Size(max = 200) String room,
            @Size(max = 255) String preferredVisitSlot,
            Boolean anonymous,
            Boolean rerunPrediction
    ) {}

    public record AddMessageRequest(@NotBlank @Size(max = 5000) String message, Boolean internal) {}

    public record FeedbackRequest(
            @NotNull @Min(1) @Max(5) Integer rating,
            @Size(max = 1000) String comment
    ) {}

    public record ReopenRequest(@Size(max = 1000) String reason) {}
}
