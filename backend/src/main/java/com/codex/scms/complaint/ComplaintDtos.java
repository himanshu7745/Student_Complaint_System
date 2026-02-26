package com.codex.scms.complaint;

import com.codex.scms.domain.enums.ComplaintEventType;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.domain.enums.ComplaintStatus;
import com.codex.scms.domain.enums.EventActorType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class ComplaintDtos {
    private ComplaintDtos() {}

    public record UploadedImageInput(
        @NotBlank String url,
        String deleteHash
    ) {}

    public record CreateComplaintRequest(
        @NotBlank @Size(max = 300) String title,
        @NotBlank @Size(max = 5000) String description,
        @NotBlank @Size(max = 255) String area,
        @NotNull LocalDate complaintDate,
        @Valid List<UploadedImageInput> images
    ) {}

    public record AssignDepartmentRequest(
        @NotNull UUID departmentId,
        @Size(max = 1000) String note
    ) {}

    public record OverrideAiRequest(
        @NotNull ComplaintSeverity aiSeverity,
        UUID aiDepartmentId,
        Boolean resendEmailIfAssigned
    ) {}

    public record AcknowledgeComplaintRequest(
        @NotBlank String token,
        @Size(max = 2000) String message
    ) {}

    public record ManualAcknowledgeRequest(
        @Size(max = 2000) String message
    ) {}

    public record MarkResolvedRequest(
        @Size(max = 2000) String message
    ) {}

    public record EscalateComplaintRequest(
        @Size(max = 2000) String reason
    ) {}

    public record ActionTakenRequest(
        @NotBlank @Size(max = 2000) String message
    ) {}

    public record InternalNoteRequest(
        @NotBlank @Size(max = 2000) String message
    ) {}

    public record UserSummary(UUID id, String name, String email) {}
    public record DepartmentSummary(UUID id, String name, String authorityEmail) {}
    public record ComplaintImageResponse(UUID id, String imageUrl, String deleteHash, Instant createdAt) {}

    public record ComplaintEventResponse(
        UUID id,
        ComplaintEventType eventType,
        String message,
        EventActorType createdBy,
        Instant createdAt
    ) {}

    public record ComplaintResponse(
        UUID id,
        String referenceId,
        UserSummary student,
        String title,
        String description,
        String area,
        LocalDate complaintDate,
        ComplaintSeverity aiSeverity,
        DepartmentSummary aiSuggestedDepartment,
        DepartmentSummary assignedDepartment,
        UserSummary assignedByAdmin,
        ComplaintStatus status,
        Instant emailSentAt,
        Instant slaDueAt,
        Instant ackReceivedAt,
        Instant studentResolvedAt,
        Instant escalatedAt,
        Instant createdAt,
        Instant updatedAt,
        boolean overdue,
        String aiRawResponseJson,
        List<ComplaintImageResponse> images,
        List<ComplaintEventResponse> timeline
    ) {}

    public record ComplaintListItemResponse(
        UUID id,
        String referenceId,
        String title,
        String area,
        LocalDate complaintDate,
        ComplaintSeverity aiSeverity,
        ComplaintStatus status,
        boolean overdue,
        DepartmentSummary assignedDepartment,
        Instant slaDueAt,
        Instant createdAt,
        UserSummary student
    ) {}

    public record StudentDashboardKpis(long total, long pending, long assigned, long resolved, long overdue) {}
    public record AdminDashboardKpis(long total, long newCount, long pendingAssignment, long overdue, long closed) {}
}
