package com.campus.complaints.domain.admin.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

public final class AdminDtos {
    private AdminDtos() {}

    public record InboxSummaryDTO(long open, long unassigned, long slaBreaches, long avgResolutionHours, long manualReviewCount) {}
    public record TrendPointDTO(String bucket, long createdCount, long resolvedCount) {}
    public record CategoryMetricDTO(String category, long count) {}

    public record ReviewQueueItemDTO(
            String complaintId,
            String title,
            String description,
            String status,
            String priority,
            boolean needsReview,
            String reviewReason,
            List<String> highlightedKeywords,
            Double overallConfidence,
            Double severityScore,
            List<LabelScoreDTO> labels,
            SuggestedRoutingDTO suggestedRouting,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record LabelScoreDTO(String label, Double score) {}
    public record SuggestedRoutingDTO(UserSummaryDTO owner, List<UserSummaryDTO> collaborators) {}
    public record UserSummaryDTO(Long id, String name, String role, String department) {}

    public record ReviewApproveRequest(@Size(max = 2000) String internalNotes) {}
    public record ReviewEditRequest(
            @NotEmpty List<String> categories,
            @NotBlank String primaryCategory,
            @NotBlank String priority,
            Long ownerUserId,
            List<Long> collaboratorUserIds,
            @Size(max = 2000) String internalNotes
    ) {}

    public record AssignComplaintRequest(
            @NotNull Long ownerUserId,
            List<Long> collaboratorUserIds,
            @Size(max = 1000) String reason
    ) {}

    public record StatusChangeRequest(
            @NotBlank String status,
            @Size(max = 2000) String comment
    ) {}

    public record EscalateRequest(
            String level,
            Long escalatedToUserId,
            String escalatedToRole,
            @NotBlank @Size(max = 1000) String reason
    ) {}

    public record ResolveRequest(
            @NotBlank @Size(max = 4000) String resolutionNote,
            List<Long> attachmentIds
    ) {}
}
