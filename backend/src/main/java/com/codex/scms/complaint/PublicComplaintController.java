package com.codex.scms.complaint;

import com.codex.scms.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Tag(name = "Public Complaint Acknowledgement")
public class PublicComplaintController {

    private final ComplaintService complaintService;

    @GetMapping(value = "/{id}/acknowledge-link", produces = MediaType.TEXT_HTML_VALUE)
    public String acknowledgementLandingPage(@PathVariable UUID id, @RequestParam String token) {
        return complaintService.acknowledgementLandingPage(id, token);
    }

    @PostMapping(value = "/{id}/acknowledge", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ComplaintDtos.ComplaintResponse> acknowledgeJson(
        @PathVariable UUID id,
        @Valid @RequestBody ComplaintDtos.AcknowledgeComplaintRequest request
    ) {
        return ApiResponse.ok("Acknowledgement received", complaintService.acknowledgeByToken(id, request));
    }

    @PostMapping(value = "/{id}/acknowledge", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.TEXT_HTML_VALUE)
    public String acknowledgeForm(
        @PathVariable UUID id,
        @RequestParam String token,
        @RequestParam(required = false) String message
    ) {
        complaintService.acknowledgeByToken(id, new ComplaintDtos.AcknowledgeComplaintRequest(token, message));
        return "<html><body style='font-family:Arial;padding:24px;'><h3>Acknowledgement received</h3><p>Complaint reference: CMP-" + id + "</p></body></html>";
    }
}
