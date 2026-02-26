package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.attachment.ComplaintAttachmentEntity;
import com.campus.complaints.domain.complaint.api.ComplaintDtos;
import com.campus.complaints.domain.prediction.ComplaintPredictionEntity;
import com.campus.complaints.domain.sla.SlaService;
import com.campus.complaints.domain.user.UserEntity;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ComplaintDtoAssembler {

    private final SlaService slaService;

    public ComplaintDtos.ComplaintListItemDTO toListItem(ComplaintEntity complaint,
                                                         List<ComplaintCategoryEntity> categories,
                                                         Optional<ComplaintPredictionEntity> prediction,
                                                         List<ComplaintAssignmentEntity> assignments) {
        return new ComplaintDtos.ComplaintListItemDTO(
                complaint.getComplaintCode(),
                complaint.getTitle(),
                complaint.getStatus().name(),
                complaint.getPriority().name(),
                complaint.isNeedsReview(),
                complaint.getReviewReason(),
                new ComplaintDtos.LocationDTO(complaint.getHostelName(), complaint.getBuildingName(), complaint.getRoomName()),
                categories.stream().map(this::toCategory).toList(),
                prediction.map(p -> toPrediction(p, categories)).orElse(null),
                toAssignments(complaint.getOwnerUser(), assignments),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                toSla(complaint)
        );
    }

    public ComplaintDtos.ComplaintDetailDTO toDetail(ComplaintEntity complaint,
                                                     List<ComplaintCategoryEntity> categories,
                                                     Optional<ComplaintPredictionEntity> prediction,
                                                     List<ComplaintAssignmentEntity> assignments,
                                                     List<ComplaintAttachmentEntity> attachments,
                                                     List<ComplaintMessageEntity> messages,
                                                     List<ComplaintTimelineEntity> timeline,
                                                     boolean includeInternalMessages) {
        List<ComplaintDtos.MessageDTO> mappedMessages = messages.stream()
                .filter(m -> includeInternalMessages || !m.isInternal())
                .map(this::toMessage)
                .toList();
        List<ComplaintDtos.TimelineEventDTO> mappedTimeline = timeline.stream().map(this::toTimeline).toList();
        List<ComplaintDtos.TimelineEventDTO> audit = timeline.stream()
                .filter(t -> t.getOldValue() != null || t.getNewValue() != null)
                .map(this::toTimeline)
                .toList();
        return new ComplaintDtos.ComplaintDetailDTO(
                complaint.getComplaintCode(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getStatus().name(),
                complaint.getPriority().name(),
                complaint.isAnonymous(),
                complaint.isNeedsReview(),
                complaint.getReviewReason(),
                complaint.getReopenedCount(),
                new ComplaintDtos.LocationDTO(complaint.getHostelName(), complaint.getBuildingName(), complaint.getRoomName()),
                complaint.getPreferredVisitSlot(),
                categories.stream().map(this::toCategory).toList(),
                prediction.map(p -> toPrediction(p, categories)).orElse(null),
                toAssignments(complaint.getOwnerUser(), assignments),
                toSla(complaint),
                complaint.getFeedbackRating(),
                complaint.getFeedbackComment(),
                complaint.getResolvedAt(),
                complaint.getClosedAt(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                attachments.stream().map(this::toAttachment).toList(),
                mappedMessages,
                mappedTimeline,
                audit
        );
    }

    public ComplaintDtos.ComplaintCategoryDTO toCategory(ComplaintCategoryEntity category) {
        return new ComplaintDtos.ComplaintCategoryDTO(category.getCategory().name(), category.isPrimary(), category.getConfidence());
    }

    public ComplaintDtos.PredictionDTO toPrediction(ComplaintPredictionEntity prediction, List<ComplaintCategoryEntity> categories) {
        List<ComplaintDtos.LabelConfidenceDTO> labels = categories.stream()
                .sorted(Comparator.comparing(ComplaintCategoryEntity::isPrimary).reversed().thenComparing(ComplaintCategoryEntity::getConfidence, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(c -> new ComplaintDtos.LabelConfidenceDTO(c.getCategory().name(), c.getConfidence()))
                .toList();
        return new ComplaintDtos.PredictionDTO(
                prediction.getModelVersion(),
                prediction.getOverallConfidence(),
                prediction.getSeverityScore(),
                labels,
                !prediction.isSuccess(),
                prediction.getFailureReason(),
                prediction.getPredictedAt()
        );
    }

    private ComplaintDtos.AssignmentDTO toAssignments(UserEntity owner, List<ComplaintAssignmentEntity> assignments) {
        ComplaintDtos.UserRefDTO ownerDto = owner != null ? toUser(owner) : null;
        List<ComplaintDtos.UserRefDTO> collaborators = assignments.stream()
                .filter(a -> a.getAssignmentType() == AssignmentType.COLLABORATOR)
                .map(ComplaintAssignmentEntity::getUser)
                .map(this::toUser)
                .toList();
        return new ComplaintDtos.AssignmentDTO(ownerDto, collaborators);
    }

    private ComplaintDtos.UserRefDTO toUser(UserEntity u) {
        return new ComplaintDtos.UserRefDTO(u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.getDepartment().name());
    }

    private ComplaintDtos.AttachmentDTO toAttachment(ComplaintAttachmentEntity attachment) {
        return new ComplaintDtos.AttachmentDTO(
                attachment.getId(),
                attachment.getFileName(),
                attachment.getMimeType(),
                attachment.getSize(),
                attachment.getPublicUrl(),
                attachment.getUploader().getId(),
                attachment.getUploader().getName(),
                attachment.getCreatedAt()
        );
    }

    public ComplaintDtos.MessageDTO toMessage(ComplaintMessageEntity message) {
        return new ComplaintDtos.MessageDTO(
                message.getId(),
                message.getComplaint().getId(),
                toUser(message.getSender()),
                message.getMessage(),
                message.isInternal(),
                message.getCreatedAt()
        );
    }

    public ComplaintDtos.TimelineEventDTO toTimeline(ComplaintTimelineEntity timeline) {
        ComplaintDtos.UserRefDTO actor = timeline.getActor() == null ? null : toUser(timeline.getActor());
        return new ComplaintDtos.TimelineEventDTO(
                timeline.getId(),
                timeline.getEventType().name(),
                timeline.getOldValue(),
                timeline.getNewValue(),
                timeline.getDetail(),
                actor,
                timeline.getCreatedAt()
        );
    }

    private ComplaintDtos.SlaDTO toSla(ComplaintEntity complaint) {
        return new ComplaintDtos.SlaDTO(
                complaint.getAcknowledgeDueAt(),
                complaint.getResolveDueAt(),
                slaService.isAcknowledgeOverdue(complaint),
                slaService.isResolveOverdue(complaint)
        );
    }
}
