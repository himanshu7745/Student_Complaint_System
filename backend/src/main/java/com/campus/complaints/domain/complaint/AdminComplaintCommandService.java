package com.campus.complaints.domain.complaint;

import com.campus.complaints.common.exception.BadRequestException;
import com.campus.complaints.common.exception.ConflictException;
import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.admin.api.AdminDtos;
import com.campus.complaints.domain.attachment.AttachmentService;
import com.campus.complaints.domain.prediction.ComplaintPredictionRepository;
import com.campus.complaints.domain.sla.*;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserAccessService;
import com.campus.complaints.domain.user.UserEntity;
import com.campus.complaints.domain.user.UserRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AdminComplaintCommandService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintCategoryRepository complaintCategoryRepository;
    private final ComplaintAssignmentRepository complaintAssignmentRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
    private final ComplaintQueryService complaintQueryService;
    private final ComplaintStatusTransitionValidator transitionValidator;
    private final TimelineService timelineService;
    private final UserRepository userRepository;
    private final UserAccessService userAccessService;
    private final EscalationRepository escalationRepository;
    private final AttachmentService attachmentService;
    private final ComplaintPredictionRepository complaintPredictionRepository;
    private final SlaService slaService;

    @Transactional
    public void assign(String complaintCode, AdminDtos.AssignComplaintRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();
        UserEntity owner = userRepository.findById(request.ownerUserId()).orElseThrow(() -> new NotFoundException("Owner user not found"));
        List<UserEntity> collaborators = new ArrayList<>();
        if (request.collaboratorUserIds() != null) {
            for (Long id : request.collaboratorUserIds()) {
                collaborators.add(userRepository.findById(id).orElseThrow(() -> new NotFoundException("Collaborator not found: " + id)));
            }
        }
        replaceAssignments(complaint, owner, collaborators);
        complaint.setNeedsReview(false);
        complaint.setReviewReason(null);
        complaintRepository.save(complaint);
        timelineService.add(complaint, TimelineEventType.ASSIGNED, null, owner.getName(), actor,
                StringUtils.hasText(request.reason()) ? request.reason().trim() : "Assignment updated");
    }

    @Transactional
    public void changeStatus(String complaintCode, AdminDtos.StatusChangeRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN, RoleType.ROLE_REVIEWER);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();
        ComplaintStatus target = ComplaintStatus.valueOf(request.status().trim().toUpperCase(Locale.ROOT));
        boolean hasResolution = StringUtils.hasText(request.comment()) || complaint.getResolvedAt() != null;
        transitionValidator.validate(complaint.getStatus(), target, target != ComplaintStatus.RESOLVED || hasResolution);

        ComplaintStatus old = complaint.getStatus();
        complaint.setStatus(target);
        if (target == ComplaintStatus.RESOLVED) complaint.setResolvedAt(OffsetDateTime.now());
        if (target == ComplaintStatus.CLOSED) complaint.setClosedAt(OffsetDateTime.now());
        if (target == ComplaintStatus.REOPENED) complaint.setReopenedCount(complaint.getReopenedCount() + 1);
        complaintRepository.save(complaint);

        timelineService.add(complaint, TimelineEventType.STATUS_CHANGED, old.name(), target.name(), actor, trimToNull(request.comment()));
    }

    @Transactional
    public void escalate(String complaintCode, AdminDtos.EscalateRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();

        EscalationEntity escalation = new EscalationEntity();
        escalation.setComplaint(complaint);
        escalation.setLevel(parseEscalationLevel(request.level()));
        escalation.setReason(request.reason());
        if (request.escalatedToUserId() != null) {
            escalation.setEscalatedToUser(userRepository.findById(request.escalatedToUserId())
                    .orElseThrow(() -> new NotFoundException("Escalation target user not found")));
        }
        if (StringUtils.hasText(request.escalatedToRole())) {
            escalation.setEscalatedToRole(RoleType.valueOf(request.escalatedToRole().trim().toUpperCase(Locale.ROOT)));
        }
        escalationRepository.save(escalation);
        timelineService.add(complaint, TimelineEventType.ESCALATED, null, escalation.getLevel().name(), actor, request.reason());
    }

    @Transactional
    public void resolve(String complaintCode, AdminDtos.ResolveRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        if (!StringUtils.hasText(request.resolutionNote())) {
            throw new BadRequestException("Resolution note is required");
        }
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();
        ComplaintStatus old = complaint.getStatus();
        transitionValidator.validate(old, ComplaintStatus.RESOLVED, true);
        complaint.setStatus(ComplaintStatus.RESOLVED);
        complaint.setResolvedAt(OffsetDateTime.now());
        complaintRepository.save(complaint);

        if (request.attachmentIds() != null && !request.attachmentIds().isEmpty()) {
            attachmentService.attachExisting(complaint.getId(), complaint, actor, request.attachmentIds());
        }
        ComplaintMessageEntity note = new ComplaintMessageEntity();
        note.setComplaint(complaint);
        note.setSender(actor);
        note.setInternal(false);
        note.setMessage(request.resolutionNote().trim());
        complaintMessageRepository.save(note);

        timelineService.add(complaint, TimelineEventType.RESOLVED, old.name(), ComplaintStatus.RESOLVED.name(), actor, "Resolution note added");
    }

    @Transactional
    public void approveManualReview(String complaintCode, AdminDtos.ReviewApproveRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_REVIEWER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        if (!complaint.isNeedsReview()) throw new ConflictException("Complaint is not in manual review queue");
        if (complaint.getOwnerUser() == null) throw new ConflictException("Complaint cannot be approved until routing is set (edit review first)");

        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();
        complaint.setNeedsReview(false);
        complaint.setReviewReason(null);
        if (complaint.getStatus() == ComplaintStatus.NEW || complaint.getStatus() == ComplaintStatus.REOPENED) {
            complaint.setStatus(ComplaintStatus.ACKNOWLEDGED);
        }
        complaintRepository.save(complaint);

        if (StringUtils.hasText(request.internalNotes())) {
            ComplaintMessageEntity internal = new ComplaintMessageEntity();
            internal.setComplaint(complaint);
            internal.setSender(actor);
            internal.setInternal(true);
            internal.setMessage(request.internalNotes().trim());
            complaintMessageRepository.save(internal);
        }
        timelineService.add(complaint, TimelineEventType.REVIEW_APPROVED, null, "APPROVED", actor, "Manual review approved and routed");
    }

    @Transactional
    public void editManualReview(String complaintCode, AdminDtos.ReviewEditRequest request) {
        userAccessService.assertAnyRole(RoleType.ROLE_REVIEWER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();

        replaceCategories(complaint, request.categories(), request.primaryCategory());
        complaint.setPriority(PriorityLevel.valueOf(request.priority().trim().toUpperCase(Locale.ROOT)));
        slaService.applyInitialSla(complaint);
        UserEntity owner = request.ownerUserId() == null ? null : userRepository.findById(request.ownerUserId())
                .orElseThrow(() -> new NotFoundException("Owner user not found"));
        List<UserEntity> collaborators = request.collaboratorUserIds() == null ? List.of() : request.collaboratorUserIds().stream()
                .map(id -> userRepository.findById(id).orElseThrow(() -> new NotFoundException("Collaborator not found: " + id)))
                .toList();
        if (owner != null) replaceAssignments(complaint, owner, collaborators);

        complaint.setNeedsReview(false);
        complaint.setReviewReason(null);
        if (complaint.getStatus() == ComplaintStatus.NEW || complaint.getStatus() == ComplaintStatus.REOPENED) {
            complaint.setStatus(ComplaintStatus.ACKNOWLEDGED);
        }
        complaintRepository.save(complaint);

        if (StringUtils.hasText(request.internalNotes())) {
            ComplaintMessageEntity internal = new ComplaintMessageEntity();
            internal.setComplaint(complaint);
            internal.setSender(actor);
            internal.setInternal(true);
            internal.setMessage(request.internalNotes().trim());
            complaintMessageRepository.save(internal);
        }
        timelineService.add(complaint, TimelineEventType.REVIEW_APPROVED, null, "EDITED_AND_ROUTED", actor, "Manual review edits applied");
    }

    @Transactional
    public void closeResolved(String complaintCode, String reason) {
        ComplaintEntity complaint = complaintQueryService.getAdminEntityByCodeOrThrow(complaintCode);
        UserEntity actor = userRepository.findById(userAccessService.currentPrincipal().getId()).orElseThrow();
        transitionValidator.validate(complaint.getStatus(), ComplaintStatus.CLOSED, true);
        ComplaintStatus old = complaint.getStatus();
        complaint.setStatus(ComplaintStatus.CLOSED);
        complaint.setClosedAt(OffsetDateTime.now());
        complaintRepository.save(complaint);
        timelineService.add(complaint, TimelineEventType.CLOSED, old.name(), ComplaintStatus.CLOSED.name(), actor, trimToNull(reason));
    }

    private void replaceCategories(ComplaintEntity complaint, List<String> categories, String primaryCategory) {
        if (categories == null || categories.isEmpty()) throw new BadRequestException("At least one category is required");
        complaintCategoryRepository.deleteByComplaintId(complaint.getId());
        String normalizedPrimary = primaryCategory.trim().toUpperCase(Locale.ROOT);
        for (String category : categories) {
            ComplaintCategoryEntity e = new ComplaintCategoryEntity();
            e.setComplaint(complaint);
            e.setCategory(ComplaintCategoryType.valueOf(category.trim().toUpperCase(Locale.ROOT)));
            e.setPrimary(category.trim().toUpperCase(Locale.ROOT).equals(normalizedPrimary));
            e.setConfidence(1.0);
            complaintCategoryRepository.save(e);
        }
        timelineService.add(complaint, TimelineEventType.CATEGORY_CHANGED, null, String.join(",", categories), null, "Categories updated during manual review");
        timelineService.add(complaint, TimelineEventType.PRIORITY_CHANGED, null, complaint.getPriority().name(), null, "Priority will be updated separately");
    }

    private void replaceAssignments(ComplaintEntity complaint, UserEntity owner, List<UserEntity> collaborators) {
        complaintAssignmentRepository.deleteByComplaintId(complaint.getId());
        complaint.setOwnerUser(owner);
        ComplaintAssignmentEntity ownerA = new ComplaintAssignmentEntity();
        ownerA.setComplaint(complaint);
        ownerA.setUser(owner);
        ownerA.setAssignmentType(AssignmentType.OWNER);
        complaintAssignmentRepository.save(ownerA);
        for (UserEntity collaborator : collaborators) {
            if (collaborator.getId().equals(owner.getId())) continue;
            ComplaintAssignmentEntity collab = new ComplaintAssignmentEntity();
            collab.setComplaint(complaint);
            collab.setUser(collaborator);
            collab.setAssignmentType(AssignmentType.COLLABORATOR);
            complaintAssignmentRepository.save(collab);
        }
    }

    private EscalationLevel parseEscalationLevel(String raw) {
        if (!StringUtils.hasText(raw)) return EscalationLevel.RESOLVE_OVERDUE;
        return EscalationLevel.valueOf(raw.trim().toUpperCase(Locale.ROOT));
    }

    private String trimToNull(String v) {
        return StringUtils.hasText(v) ? v.trim() : null;
    }
}
