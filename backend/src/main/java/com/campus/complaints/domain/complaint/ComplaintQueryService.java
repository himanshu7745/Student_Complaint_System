package com.campus.complaints.domain.complaint;

import com.campus.complaints.common.api.PagedResponse;
import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.attachment.ComplaintAttachmentRepository;
import com.campus.complaints.domain.complaint.api.ComplaintDtos;
import com.campus.complaints.domain.prediction.ComplaintPredictionRepository;
import com.campus.complaints.domain.user.UserAccessService;
import com.campus.complaints.security.AuthenticatedUser;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ComplaintQueryService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintCategoryRepository complaintCategoryRepository;
    private final ComplaintPredictionRepository complaintPredictionRepository;
    private final ComplaintAssignmentRepository complaintAssignmentRepository;
    private final ComplaintMessageRepository complaintMessageRepository;
    private final ComplaintTimelineRepository complaintTimelineRepository;
    private final ComplaintAttachmentRepository complaintAttachmentRepository;
    private final ComplaintDtoAssembler complaintDtoAssembler;
    private final UserAccessService userAccessService;

    @Transactional(readOnly = true)
    public PagedResponse<ComplaintDtos.ComplaintListItemDTO> listUserComplaints(Boolean mine, String status, String category,
                                                                                String q, OffsetDateTime from, OffsetDateTime to,
                                                                                Integer page, Integer size) {
        AuthenticatedUser current = userAccessService.currentPrincipal();
        Pageable pageable = PageRequest.of(page == null ? 0 : page, size == null ? 20 : Math.min(size, 100), Sort.by(Sort.Direction.DESC, "updatedAt"));
        List<String> categories = StringUtils.hasText(category) ? List.of(category) : List.of();
        Page<ComplaintEntity> pageData = complaintRepository.findAll(
                ComplaintSpecifications.filter(mine == null ? true : mine, current.getId(), normalize(status), categories, null, q, from, to,
                        null, null, null, null, false), pageable);
        return PagedResponse.from(pageData.map(this::toListItem));
    }

    @Transactional(readOnly = true)
    public PagedResponse<ComplaintDtos.ComplaintListItemDTO> listAdminInbox(String status, List<String> categories, String priority,
                                                                            String confidenceLevel, String assignedTo, String location,
                                                                            Boolean needsReview, String q, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page == null ? 0 : page, size == null ? 20 : Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ComplaintEntity> dbPage = complaintRepository.findAll(
                ComplaintSpecifications.filter(false, null, normalize(status), normalizeList(categories), normalize(priority), q,
                        null, null, normalizeAssignedTo(assignedTo), location, needsReview, confidenceLevel, true), pageable);

        List<ComplaintEntity> filtered = dbPage.getContent().stream()
                .filter(c -> passesAdminAccess(c))
                .filter(c -> passesConfidence(c, confidenceLevel))
                .toList();
        Page<ComplaintDtos.ComplaintListItemDTO> mapped = new PageImpl<>(filtered.stream().map(this::toListItem).toList(), pageable, dbPage.getTotalElements());
        return PagedResponse.from(mapped);
    }

    @Transactional(readOnly = true)
    public ComplaintEntity getEntityByCodeOrThrow(String complaintCode) {
        ComplaintEntity complaint = complaintRepository.findByComplaintCode(complaintCode)
                .orElseThrow(() -> new NotFoundException("Complaint not found: " + complaintCode));
        complaint.getAssignments().size();
        complaint.getCategories().size();
        userAccessService.assertCanViewComplaint(complaint);
        return complaint;
    }

    @Transactional(readOnly = true)
    public ComplaintEntity getAdminEntityByCodeOrThrow(String complaintCode) {
        ComplaintEntity complaint = complaintRepository.findByComplaintCode(complaintCode)
                .orElseThrow(() -> new NotFoundException("Complaint not found: " + complaintCode));
        complaint.getAssignments().size();
        complaint.getCategories().size();
        userAccessService.assertCanViewComplaint(complaint);
        return complaint;
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintDetailDTO getComplaintDetail(String complaintCode) {
        ComplaintEntity complaint = getEntityByCodeOrThrow(complaintCode);
        boolean includeInternal = userAccessService.isAdminLike(userAccessService.currentPrincipal());
        return toDetail(complaint, includeInternal);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.MessageDTO> getMessages(String complaintCode) {
        ComplaintEntity complaint = getEntityByCodeOrThrow(complaintCode);
        boolean includeInternal = userAccessService.isAdminLike(userAccessService.currentPrincipal());
        return complaintMessageRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId()).stream()
                .filter(m -> includeInternal || !m.isInternal())
                .map(complaintDtoAssembler::toMessage)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.TimelineEventDTO> getTimeline(String complaintCode) {
        ComplaintEntity complaint = getEntityByCodeOrThrow(complaintCode);
        return complaintTimelineRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId()).stream()
                .map(complaintDtoAssembler::toTimeline)
                .toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintDetailDTO toDetail(ComplaintEntity complaint, boolean includeInternal) {
        List<ComplaintCategoryEntity> categories = complaintCategoryRepository.findByComplaintIdOrderByPrimaryDescConfidenceDesc(complaint.getId());
        var prediction = complaintPredictionRepository.findTopByComplaintIdOrderByPredictedAtDesc(complaint.getId());
        List<ComplaintAssignmentEntity> assignments = complaintAssignmentRepository.findByComplaintId(complaint.getId());
        List<ComplaintMessageEntity> messages = complaintMessageRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
        List<ComplaintTimelineEntity> timeline = complaintTimelineRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
        var attachments = complaintAttachmentRepository.findByComplaintIdOrderByCreatedAtAsc(complaint.getId());
        return complaintDtoAssembler.toDetail(complaint, categories, prediction, assignments, attachments, messages, timeline, includeInternal);
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintListItemDTO toListItem(ComplaintEntity complaint) {
        List<ComplaintCategoryEntity> categories = complaintCategoryRepository.findByComplaintIdOrderByPrimaryDescConfidenceDesc(complaint.getId());
        var prediction = complaintPredictionRepository.findTopByComplaintIdOrderByPredictedAtDesc(complaint.getId());
        List<ComplaintAssignmentEntity> assignments = complaintAssignmentRepository.findByComplaintId(complaint.getId());
        return complaintDtoAssembler.toListItem(complaint, categories, prediction, assignments);
    }

    private boolean passesAdminAccess(ComplaintEntity complaint) {
        try {
            complaint.getAssignments().size();
            complaint.getCategories().size();
            userAccessService.assertCanViewComplaint(complaint);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private boolean passesConfidence(ComplaintEntity complaint, String confidenceLevel) {
        if (!StringUtils.hasText(confidenceLevel)) return true;
        var prediction = complaintPredictionRepository.findTopByComplaintIdOrderByPredictedAtDesc(complaint.getId()).orElse(null);
        double conf = prediction != null && prediction.getOverallConfidence() != null ? prediction.getOverallConfidence() : 0.0;
        String level = confidenceLevel.trim().toUpperCase(Locale.ROOT);
        return switch (level) {
            case "LOW" -> conf < 0.72;
            case "HIGH" -> conf >= 0.85;
            default -> true;
        };
    }

    private String normalize(String value) {
        if (!StringUtils.hasText(value)) return null;
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return "ALL".equals(normalized) ? null : normalized;
    }

    private List<String> normalizeList(List<String> values) {
        if (values == null) return List.of();
        List<String> out = new ArrayList<>();
        for (String v : values) {
            if (!StringUtils.hasText(v)) continue;
            String normalized = v.trim().toUpperCase(Locale.ROOT);
            if (!"ALL".equals(normalized)) out.add(normalized);
        }
        return out;
    }

    private String normalizeAssignedTo(String assignedTo) {
        if (!StringUtils.hasText(assignedTo)) return null;
        String trimmed = assignedTo.trim();
        return "ALL".equalsIgnoreCase(trimmed) ? null : trimmed;
    }
}
