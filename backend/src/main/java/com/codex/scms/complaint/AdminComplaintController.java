package com.codex.scms.complaint;

import com.codex.scms.common.ApiResponse;
import com.codex.scms.common.PageResponse;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.domain.enums.ComplaintStatus;
import com.codex.scms.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Complaints")
public class AdminComplaintController {

    private final ComplaintService complaintService;

    @GetMapping("/complaints")
    public ApiResponse<PageResponse<ComplaintDtos.ComplaintListItemResponse>> listComplaints(
        @RequestParam(required = false) ComplaintStatus status,
        @RequestParam(required = false) ComplaintSeverity severity,
        @RequestParam(required = false) UUID departmentId,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.ok(PageResponse.from(
            complaintService.listAdminComplaints(status, severity, fromDate, toDate, departmentId, search, page, size)
        ));
    }

    @GetMapping("/complaints/{id}")
    public ApiResponse<ComplaintDtos.ComplaintResponse> getComplaint(@PathVariable UUID id) {
        return ApiResponse.ok(complaintService.getAdminComplaint(id));
    }

    @PostMapping("/complaints/{id}/assign-department")
    public ApiResponse<ComplaintDtos.ComplaintResponse> assignDepartment(
        @AuthenticationPrincipal AuthenticatedUser admin,
        @PathVariable UUID id,
        @Valid @RequestBody ComplaintDtos.AssignDepartmentRequest request
    ) {
        return ApiResponse.ok("Department assigned", complaintService.assignDepartment(admin, id, request));
    }

    @PostMapping("/complaints/{id}/override-ai")
    public ApiResponse<ComplaintDtos.ComplaintResponse> overrideAi(
        @AuthenticationPrincipal AuthenticatedUser admin,
        @PathVariable UUID id,
        @Valid @RequestBody ComplaintDtos.OverrideAiRequest request
    ) {
        return ApiResponse.ok("AI classification overridden", complaintService.overrideAi(admin, id, request));
    }

    @PostMapping("/complaints/{id}/resend-email")
    public ApiResponse<ComplaintDtos.ComplaintResponse> resendEmail(@PathVariable UUID id) {
        return ApiResponse.ok("Department email resent", complaintService.resendDepartmentEmail(id));
    }

    @PostMapping("/complaints/{id}/acknowledge-manual")
    public ApiResponse<ComplaintDtos.ComplaintResponse> manualAcknowledge(
        @PathVariable UUID id,
        @Valid @RequestBody(required = false) ComplaintDtos.ManualAcknowledgeRequest request
    ) {
        ComplaintDtos.ManualAcknowledgeRequest safeRequest = request == null ? new ComplaintDtos.ManualAcknowledgeRequest(null) : request;
        return ApiResponse.ok("Acknowledgement recorded", complaintService.manualAcknowledge(id, safeRequest));
    }

    @PostMapping("/complaints/{id}/action-taken")
    public ApiResponse<ComplaintDtos.ComplaintResponse> markActionTaken(
        @PathVariable UUID id,
        @Valid @RequestBody ComplaintDtos.ActionTakenRequest request
    ) {
        return ApiResponse.ok("Action taken updated", complaintService.markActionTaken(id, request));
    }

    @PostMapping("/complaints/{id}/internal-note")
    public ApiResponse<ComplaintDtos.ComplaintResponse> addInternalNote(
        @PathVariable UUID id,
        @Valid @RequestBody ComplaintDtos.InternalNoteRequest request
    ) {
        return ApiResponse.ok("Internal note added", complaintService.addInternalNote(id, request));
    }

    @GetMapping("/complaints/overdue")
    public ApiResponse<List<ComplaintDtos.ComplaintListItemResponse>> overdueList() {
        return ApiResponse.ok(complaintService.listOverdueComplaints());
    }

    @GetMapping("/dashboard/kpis")
    public ApiResponse<ComplaintDtos.AdminDashboardKpis> dashboardKpis() {
        return ApiResponse.ok(complaintService.adminDashboardKpis());
    }
}
