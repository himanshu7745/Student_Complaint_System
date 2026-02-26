package com.campus.complaints.domain.admin.api;

import com.campus.complaints.domain.complaint.*;
import com.campus.complaints.domain.prediction.ComplaintPredictionEntity;
import com.campus.complaints.domain.user.UserEntity;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    private static final Pattern WORD = Pattern.compile("[A-Za-z]{4,}");
    private static final Set<String> STOP = Set.of("this", "that", "with", "have", "from", "near", "around", "since", "where", "issue", "complaint", "happening");

    public AdminDtos.ReviewQueueItemDTO toReviewQueueItem(ComplaintEntity complaint,
                                                          ComplaintPredictionEntity prediction,
                                                          List<ComplaintCategoryEntity> categories,
                                                          List<ComplaintAssignmentEntity> assignments) {
        List<AdminDtos.LabelScoreDTO> labels = categories.stream()
                .sorted(Comparator.comparing(ComplaintCategoryEntity::isPrimary).reversed())
                .map(c -> new AdminDtos.LabelScoreDTO(c.getCategory().name(), c.getConfidence()))
                .toList();
        UserEntity owner = complaint.getOwnerUser();
        List<UserEntity> collaborators = assignments.stream().filter(a -> a.getAssignmentType() == AssignmentType.COLLABORATOR)
                .map(ComplaintAssignmentEntity::getUser).toList();
        return new AdminDtos.ReviewQueueItemDTO(
                complaint.getComplaintCode(),
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getStatus().name(),
                complaint.getPriority().name(),
                complaint.isNeedsReview(),
                complaint.getReviewReason(),
                extractKeywords(complaint),
                prediction != null ? prediction.getOverallConfidence() : null,
                prediction != null ? prediction.getSeverityScore() : null,
                labels,
                new AdminDtos.SuggestedRoutingDTO(toUser(owner), collaborators.stream().map(this::toUser).toList()),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt()
        );
    }

    public AdminDtos.UserSummaryDTO toUser(UserEntity user) {
        if (user == null) return null;
        return new AdminDtos.UserSummaryDTO(user.getId(), user.getName(), user.getRole().name(), user.getDepartment().name());
    }

    private List<String> extractKeywords(ComplaintEntity complaint) {
        String text = (complaint.getTitle() + " " + complaint.getDescription()).toLowerCase(Locale.ROOT);
        var matcher = WORD.matcher(text);
        java.util.LinkedHashSet<String> keywords = new java.util.LinkedHashSet<>();
        while (matcher.find() && keywords.size() < 6) {
            String token = matcher.group();
            if (!STOP.contains(token)) keywords.add(token);
        }
        return List.copyOf(keywords);
    }
}
