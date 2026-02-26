package com.campus.complaints.domain.complaint;

import com.campus.complaints.common.exception.BadRequestException;
import com.campus.complaints.common.exception.ForbiddenException;
import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.config.PredictionProperties;
import com.campus.complaints.domain.attachment.AttachmentService;
import com.campus.complaints.domain.attachment.ComplaintAttachmentEntity;
import com.campus.complaints.domain.complaint.api.ComplaintDtos;
import com.campus.complaints.domain.prediction.PredictionWorkflowService;
import com.campus.complaints.domain.settings.PredictionThresholdService;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserAccessService;
import com.campus.complaints.domain.user.UserEntity;
import com.campus.complaints.domain.user.UserRepository;
import com.campus.complaints.security.AuthenticatedUser;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ComplaintCommandService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
    private final ComplaintQueryService complaintQueryService;
    private final ComplaintCodeGenerator complaintCodeGenerator;
    private final ComplaintStatusTransitionValidator transitionValidator;
    private final TimelineService timelineService;
    private final UserRepository userRepository;
    private final UserAccessService userAccessService;
    private final AttachmentService attachmentService;
    private final PredictionWorkflowService predictionWorkflowService;
    private final PredictionThresholdService thresholdService;
    private final PredictionProperties predictionProperties;

    @Transactional
    public ComplaintDtos.ComplaintDetailDTO createComplaint(ComplaintDtos.CreateComplaintRequest request) {
        AuthenticatedUser principal = userAccessService.currentPrincipal();
        if (principal.getRole() != RoleType.ROLE_USER && !userAccessService.isAdminLike(principal)) {
            throw new ForbiddenException("Not allowed to create complaint");
        }
        UserEntity actor = userRepository.findById(principal.getId()).orElseThrow(() -> new NotFoundException("User not found"));

        ComplaintEntity complaint = new ComplaintEntity();
        complaint.setComplaintCode(complaintCodeGenerator.nextCode());
        complaint.setCreatedBy(actor);
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setHostelName(trimToNull(request.hostel()));
        complaint.setBuildingName(request.building().trim());
        complaint.setRoomName(request.room().trim());
        complaint.setPreferredVisitSlot(trimToNull(request.preferredVisitSlot()));
        complaint.setAnonymous(Boolean.TRUE.equals(request.anonymous()));
        complaint.setStatus(ComplaintStatus.NEW);
        complaint.setPriority(PriorityLevel.MEDIUM);
        complaint = complaintRepository.save(complaint);

        timelineService.add(complaint, TimelineEventType.CREATED, null, complaint.getStatus().name(), actor, "Complaint submitted");

        List<ComplaintAttachmentEntity> linkedAttachments = attachmentService.attachExisting(complaint.getId(), complaint, actor, request.attachmentIds());

        predictionWorkflowService.runAndApply(complaint, linkedAttachments, actor, thresholdService.getThreshold());
        complaint = complaintRepository.save(complaint);

        return complaintQueryService.toDetail(complaint, userAccessService.isAdminLike(principal));
    }
    @Transactional
    public ComplaintDtos.ComplaintDetailDTO updateComplaint(String complaintCode, ComplaintDtos.UpdateComplaintRequest request) {
        ComplaintEntity complaint = complaintQueryService.getEntityByCodeOrThrow(complaintCode);
        AuthenticatedUser principal = userAccessService.currentPrincipal();
        UserEntity actor = userRepository.findById(principal.getId()).orElseThrow(() -> new NotFoundException("User not found"));

        boolean textChanged = false;
        if (StringUtils.hasText(request.title()) && !request.title().equals(complaint.getTitle())) {
            timelineService.add(complaint, TimelineEventType.UPDATED, complaint.getTitle(), request.title(), actor, "Title updated");
            complaint.setTitle(request.title().trim());
            textChanged = true;
        }
        if (StringUtils.hasText(request.description()) && !request.description().equals(complaint.getDescription())) {
            timelineService.add(complaint, TimelineEventType.UPDATED, null, null, actor, "Description updated");
            complaint.setDescription(request.description().trim());
            textChanged = true;
        }
        if (request.hostel() != null) complaint.setHostelName(trimToNull(request.hostel()));
        if (request.building() != null) complaint.setBuildingName(trimToNull(request.building()));
        if (request.room() != null) complaint.setRoomName(trimToNull(request.room()));
        if (request.preferredVisitSlot() != null) complaint.setPreferredVisitSlot(trimToNull(request.preferredVisitSlot()));
        if (request.anonymous() != null) complaint.setAnonymous(request.anonymous());

        complaint = complaintRepository.save(complaint);

        boolean rerun = Boolean.TRUE.equals(request.rerunPrediction()) || (request.rerunPrediction() == null && predictionProperties.isRerunOnUpdate() && textChanged);
        if (rerun) {
            List<ComplaintAttachmentEntity> attachments = attachmentService.listByComplaint(complaint);
            predictionWorkflowService.runAndApply(complaint, attachments, actor, thresholdService.getThreshold());
            complaintRepository.save(complaint);
        }
        return complaintQueryService.toDetail(complaint, userAccessService.isAdminLike(principal));
    }

    @Transactional
    public ComplaintDtos.MessageDTO addMessage(String complaintCode, ComplaintDtos.AddMessageRequest request) {
        ComplaintEntity complaint = complaintQueryService.getEntityByCodeOrThrow(complaintCode);
        AuthenticatedUser principal = userAccessService.currentPrincipal();
        UserEntity actor = userRepository.findById(principal.getId()).orElseThrow(() -> new NotFoundException("User not found"));
        boolean internal = Boolean.TRUE.equals(request.internal());
        if (internal) userAccessService.assertCanCreateInternalMessage(complaint);
        if (principal.getRole() == RoleType.ROLE_USER && internal) throw new ForbiddenException("Internal message not allowed");

        ComplaintMessageEntity message = new ComplaintMessageEntity();
        message.setComplaint(complaint);
        message.setSender(actor);
        message.setMessage(request.message().trim());
        message.setInternal(internal);
        message = complaintMessageRepository.save(message);
        timelineService.add(complaint, TimelineEventType.MESSAGE_ADDED, null, null, actor, internal ? "Internal note added" : "Message added");
        return complaintQueryService.getMessages(complaintCode).stream().reduce((first, second) -> second).orElseThrow();
    }

    @Transactional
    public List<ComplaintDtos.AttachmentDTO> uploadAttachments(String complaintCode, List<MultipartFile> files, Boolean rerunPrediction) {
        ComplaintEntity complaint = complaintQueryService.getEntityByCodeOrThrow(complaintCode);
        AuthenticatedUser principal = userAccessService.currentPrincipal();
        UserEntity actor = userRepository.findById(principal.getId()).orElseThrow(() -> new NotFoundException("User not found"));
        if (files == null || files.isEmpty()) throw new BadRequestException("No files uploaded");

        List<ComplaintAttachmentEntity> attachments = attachmentService.uploadToComplaint(complaint, actor, files);
        timelineService.add(complaint, TimelineEventType.ATTACHMENT_ADDED, null, Integer.toString(attachments.size()), actor, "Attachments uploaded");

        boolean shouldRerun = Boolean.TRUE.equals(rerunPrediction);
        if (shouldRerun) {
            List<ComplaintAttachmentEntity> all = attachmentService.listByComplaint(complaint);
            predictionWorkflowService.runAndApply(complaint, all, actor, thresholdService.getThreshold());
            complaintRepository.save(complaint);
        }
        return complaintQueryService.toDetail(complaint, userAccessService.isAdminLike(principal)).attachments();
    }

    @Transactional
    public ComplaintDtos.ComplaintDetailDTO reopen(String complaintCode, ComplaintDtos.ReopenRequest request) {
        ComplaintEntity complaint = complaintQueryService.getEntityByCodeOrThrow(complaintCode);
        if (!(complaint.getStatus() == ComplaintStatus.RESOLVED || complaint.getStatus() == ComplaintStatus.CLOSED)) {
            throw new BadRequestException("Only resolved/closed complaints can be reopened");
        }
        AuthenticatedUser principal = userAccessService.currentPrincipal();
        UserEntity actor = userRepository.findById(principal.getId()).orElseThrow(() -> new NotFoundException("User not found"));
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.REOPENED);
        complaint.setReopenedCount(complaint.getReopenedCount() + 1);
        complaint.setClosedAt(null);
        complaint.setResolvedAt(null);
        complaint.setNeedsReview(false);
        complaint.setReviewReason(null);
        complaintRepository.save(complaint);
        timelineService.add(complaint, TimelineEventType.REOPENED, oldStatus.name(), ComplaintStatus.REOPENED.name(), actor,
                trimToNull(request.reason()));
        return complaintQueryService.toDetail(complaint, userAccessService.isAdminLike(principal));
    }

    @Transactional
    public ComplaintDtos.ComplaintDetailDTO addFeedback(String complaintCode, ComplaintDtos.FeedbackRequest request) {
        ComplaintEntity complaint = complaintQueryService.getEntityByCodeOrThrow(complaintCode);
        if (!(complaint.getStatus() == ComplaintStatus.RESOLVED || complaint.getStatus() == ComplaintStatus.CLOSED)) {
            throw new BadRequestException("Feedback can be submitted only after resolution");
        }
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow(() -> new NotFoundException("User not found"));
        complaint.setFeedbackRating(request.rating());
        complaint.setFeedbackComment(trimToNull(request.comment()));
        complaint.setFeedbackAt(OffsetDateTime.now());
        complaintRepository.save(complaint);
        timelineService.add(complaint, TimelineEventType.FEEDBACK_ADDED, null, String.valueOf(request.rating()), actor, trimToNull(request.comment()));
        return complaintQueryService.toDetail(complaint, userAccessService.isAdminLike(userAccessService.currentPrincipal()));
    }

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) return null;
        return value.trim();
    }
}
