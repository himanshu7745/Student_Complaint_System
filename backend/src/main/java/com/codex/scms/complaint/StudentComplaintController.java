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
import java.util.UUID;

@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@Tag(name = "Student Complaints")
public class StudentComplaintController {

    private final ComplaintService complaintService;

    @PostMapping("/complaints")
    public ApiResponse<ComplaintDtos.ComplaintResponse> createComplaint(
        @AuthenticationPrincipal AuthenticatedUser user,
        @Valid @RequestBody ComplaintDtos.CreateComplaintRequest request
    ) {
        return ApiResponse.ok("Complaint created", complaintService.createComplaint(user, request));
    }

    @GetMapping("/complaints")
    public ApiResponse<PageResponse<ComplaintDtos.ComplaintListItemResponse>> listMyComplaints(
        @AuthenticationPrincipal AuthenticatedUser user,
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
            complaintService.listStudentComplaints(user, status, severity, fromDate, toDate, departmentId, search, page, size)
        ));
    }

    @GetMapping("/complaints/{id}")
    public ApiResponse<ComplaintDtos.ComplaintResponse> getComplaint(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID id) {
        return ApiResponse.ok(complaintService.getStudentComplaint(user, id));
    }

    @PostMapping("/complaints/{id}/resolve")
    public ApiResponse<ComplaintDtos.ComplaintResponse> markResolved(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable UUID id,
        @Valid @RequestBody(required = false) ComplaintDtos.MarkResolvedRequest request
    ) {
        ComplaintDtos.MarkResolvedRequest safeRequest = request == null ? new ComplaintDtos.MarkResolvedRequest(null) : request;
        return ApiResponse.ok("Complaint resolved", complaintService.markResolved(user, id, safeRequest));
    }

    @PostMapping("/complaints/{id}/escalate")
    public ApiResponse<ComplaintDtos.ComplaintResponse> escalate(
        @AuthenticationPrincipal AuthenticatedUser user,
        @PathVariable UUID id,
        @Valid @RequestBody(required = false) ComplaintDtos.EscalateComplaintRequest request
    ) {
        ComplaintDtos.EscalateComplaintRequest safeRequest = request == null ? new ComplaintDtos.EscalateComplaintRequest(null) : request;
        return ApiResponse.ok("Complaint escalated", complaintService.escalateToDirector(user, id, safeRequest));
    }

    @GetMapping("/dashboard/kpis")
    public ApiResponse<ComplaintDtos.StudentDashboardKpis> dashboardKpis(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.ok(complaintService.studentDashboardKpis(user));
    }
}
