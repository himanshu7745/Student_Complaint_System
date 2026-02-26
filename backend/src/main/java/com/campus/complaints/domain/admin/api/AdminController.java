package com.campus.complaints.domain.admin.api;

import com.campus.complaints.common.api.ApiResponse;
import com.campus.complaints.common.api.PagedResponse;
import com.campus.complaints.domain.analytics.AnalyticsService;
import com.campus.complaints.domain.complaint.AdminComplaintCommandService;
import com.campus.complaints.domain.complaint.ComplaintQueryService;
import com.campus.complaints.domain.complaint.api.ComplaintDtos;
import com.campus.complaints.domain.review.ManualReviewQueryService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ComplaintQueryService complaintQueryService;
    private final AdminComplaintCommandService adminComplaintCommandService;
    private final ManualReviewQueryService manualReviewQueryService;
    private final AnalyticsService analyticsService;

    @GetMapping("/inbox")
    public ApiResponse<PagedResponse<ComplaintDtos.ComplaintListItemDTO>> inbox(
            @RequestParam(required = false) String status,
            @RequestParam(name = "category", required = false) List<String> categories,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String confidenceLevel,
            @RequestParam(required = false) String assignedTo,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Boolean needsReview,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ApiResponse.of(complaintQueryService.listAdminInbox(status, categories, priority, confidenceLevel, assignedTo, location, needsReview, q, page, size));
    }

    @GetMapping("/complaints/{id}")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> adminComplaintDetail(@PathVariable("id") String complaintCode) {
        return ApiResponse.of(complaintQueryService.getComplaintDetail(complaintCode));
    }

    @PostMapping("/complaints/{id}/assign")
    public ApiResponse<Void> assign(@PathVariable("id") String complaintCode, @Valid @RequestBody AdminDtos.AssignComplaintRequest request) {
        adminComplaintCommandService.assign(complaintCode, request);
        return ApiResponse.of(null, "Assigned");
    }

    @PostMapping("/complaints/{id}/status")
    public ApiResponse<Void> status(@PathVariable("id") String complaintCode, @Valid @RequestBody AdminDtos.StatusChangeRequest request) {
        adminComplaintCommandService.changeStatus(complaintCode, request);
        return ApiResponse.of(null, "Status updated");
    }

    @PostMapping("/complaints/{id}/escalate")
    public ApiResponse<Void> escalate(@PathVariable("id") String complaintCode, @Valid @RequestBody AdminDtos.EscalateRequest request) {
        adminComplaintCommandService.escalate(complaintCode, request);
        return ApiResponse.of(null, "Escalated");
    }

    @PostMapping("/complaints/{id}/resolve")
    public ApiResponse<Void> resolve(@PathVariable("id") String complaintCode, @Valid @RequestBody AdminDtos.ResolveRequest request) {
        adminComplaintCommandService.resolve(complaintCode, request);
        return ApiResponse.of(null, "Resolved");
    }

    @GetMapping("/review-queue")
    public ApiResponse<PagedResponse<AdminDtos.ReviewQueueItemDTO>> reviewQueue(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ApiResponse.of(manualReviewQueryService.getReviewQueue(page, size));
    }

    @PostMapping("/review-queue/{id}/approve")
    public ApiResponse<Void> approveReview(@PathVariable("id") String complaintCode, @RequestBody(required = false) AdminDtos.ReviewApproveRequest request) {
        adminComplaintCommandService.approveManualReview(complaintCode, request == null ? new AdminDtos.ReviewApproveRequest(null) : request);
        return ApiResponse.of(null, "Review approved");
    }

    @PostMapping("/review-queue/{id}/edit")
    public ApiResponse<Void> editReview(@PathVariable("id") String complaintCode, @Valid @RequestBody AdminDtos.ReviewEditRequest request) {
        adminComplaintCommandService.editManualReview(complaintCode, request);
        return ApiResponse.of(null, "Review edited and routed");
    }

    @GetMapping("/analytics/summary")
    public ApiResponse<AdminDtos.InboxSummaryDTO> summary() {
        return ApiResponse.of(analyticsService.summary());
    }

    @GetMapping("/analytics/trends")
    public ApiResponse<List<AdminDtos.TrendPointDTO>> trends(@RequestParam(defaultValue = "7") Integer days) {
        return ApiResponse.of(analyticsService.trends(Math.min(Math.max(days, 1), 90)));
    }

    @GetMapping("/analytics/by-category")
    public ApiResponse<List<AdminDtos.CategoryMetricDTO>> byCategory() {
        return ApiResponse.of(analyticsService.byCategory());
    }
}
