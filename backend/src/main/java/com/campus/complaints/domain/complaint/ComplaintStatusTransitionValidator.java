package com.campus.complaints.domain.complaint;

import com.campus.complaints.common.exception.ConflictException;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ComplaintStatusTransitionValidator {

    private static final Map<ComplaintStatus, Set<ComplaintStatus>> ALLOWED = Map.of(
            ComplaintStatus.NEW, Set.of(ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.NEEDS_INFO),
            ComplaintStatus.ACKNOWLEDGED, Set.of(ComplaintStatus.IN_PROGRESS, ComplaintStatus.NEEDS_INFO, ComplaintStatus.RESOLVED),
            ComplaintStatus.IN_PROGRESS, Set.of(ComplaintStatus.NEEDS_INFO, ComplaintStatus.RESOLVED),
            ComplaintStatus.NEEDS_INFO, Set.of(ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS),
            ComplaintStatus.RESOLVED, Set.of(ComplaintStatus.CLOSED, ComplaintStatus.REOPENED),
            ComplaintStatus.CLOSED, Set.of(ComplaintStatus.REOPENED),
            ComplaintStatus.REOPENED, Set.of(ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.NEEDS_INFO)
    );

    public void validate(ComplaintStatus current, ComplaintStatus target, boolean hasResolutionNote) {
        if (current == target) return;
        Set<ComplaintStatus> next = ALLOWED.getOrDefault(current, Set.of());
        if (!next.contains(target)) {
            throw new ConflictException("Invalid status transition: " + current + " -> " + target);
        }
        if (target == ComplaintStatus.CLOSED && current != ComplaintStatus.RESOLVED) {
            throw new ConflictException("Complaint can be closed only after it is resolved");
        }
        if (target == ComplaintStatus.RESOLVED && !hasResolutionNote) {
            throw new ConflictException("Resolution note is required before resolving");
        }
    }
}
