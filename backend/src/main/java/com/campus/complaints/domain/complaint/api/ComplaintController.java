package com.campus.complaints.domain.complaint.api;

import com.campus.complaints.common.api.ApiResponse;
import com.campus.complaints.common.api.PagedResponse;
import com.campus.complaints.domain.complaint.ComplaintCommandService;
import com.campus.complaints.domain.complaint.ComplaintQueryService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintCommandService complaintCommandService;
    private final ComplaintQueryService complaintQueryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create complaint and trigger prediction/routing")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> create(@Valid @RequestBody ComplaintDtos.CreateComplaintRequest request) {
        return ApiResponse.of(complaintCommandService.createComplaint(request));
    }

    @GetMapping
    public ApiResponse<PagedResponse<ComplaintDtos.ComplaintListItemDTO>> list(
            @RequestParam(defaultValue = "true") Boolean mine,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size
    ) {
        return ApiResponse.of(complaintQueryService.listUserComplaints(mine, status, category, q, from, to, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> get(@PathVariable("id") String complaintCode) {
        return ApiResponse.of(complaintQueryService.getComplaintDetail(complaintCode));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> update(@PathVariable("id") String complaintCode,
                                                                @Valid @RequestBody ComplaintDtos.UpdateComplaintRequest request) {
        return ApiResponse.of(complaintCommandService.updateComplaint(complaintCode, request));
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ComplaintDtos.MessageDTO> addMessage(@PathVariable("id") String complaintCode,
                                                            @Valid @RequestBody ComplaintDtos.AddMessageRequest request) {
        return ApiResponse.of(complaintCommandService.addMessage(complaintCode, request));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<ComplaintDtos.MessageDTO>> getMessages(@PathVariable("id") String complaintCode) {
        return ApiResponse.of(complaintQueryService.getMessages(complaintCode));
    }

    @PostMapping(path = "/{id}/attachments", consumes = {"multipart/form-data"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<List<ComplaintDtos.AttachmentDTO>> uploadAttachments(
            @PathVariable("id") String complaintCode,
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(name = "rerunPrediction", defaultValue = "false") Boolean rerunPrediction
    ) {
        return ApiResponse.of(complaintCommandService.uploadAttachments(complaintCode, files, rerunPrediction));
    }

    @GetMapping("/{id}/timeline")
    public ApiResponse<List<ComplaintDtos.TimelineEventDTO>> timeline(@PathVariable("id") String complaintCode) {
        return ApiResponse.of(complaintQueryService.getTimeline(complaintCode));
    }

    @PostMapping("/{id}/reopen")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> reopen(@PathVariable("id") String complaintCode,
                                                                @RequestBody(required = false) ComplaintDtos.ReopenRequest request) {
        ComplaintDtos.ReopenRequest body = request == null ? new ComplaintDtos.ReopenRequest(null) : request;
        return ApiResponse.of(complaintCommandService.reopen(complaintCode, body));
    }

    @PostMapping("/{id}/feedback")
    public ApiResponse<ComplaintDtos.ComplaintDetailDTO> feedback(@PathVariable("id") String complaintCode,
                                                                  @Valid @RequestBody ComplaintDtos.FeedbackRequest request) {
        return ApiResponse.of(complaintCommandService.addFeedback(complaintCode, request));
    }
}
