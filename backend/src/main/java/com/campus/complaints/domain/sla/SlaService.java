package com.campus.complaints.domain.sla;

import com.campus.complaints.common.exception.NotFoundException;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.domain.complaint.ComplaintStatus;
import com.campus.complaints.domain.complaint.PriorityLevel;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaRuleRepository slaRuleRepository;
    private final Clock clock;

    public void applyInitialSla(ComplaintEntity complaint) {
        SlaRuleEntity rule = slaRuleRepository.findByPriorityAndActiveTrue(complaint.getPriority())
                .orElseThrow(() -> new NotFoundException("SLA rule not found for priority " + complaint.getPriority()));
        OffsetDateTime base = complaint.getCreatedAt() != null ? complaint.getCreatedAt() : OffsetDateTime.now(clock);
        complaint.setAcknowledgeDueAt(base.plusMinutes(rule.getAcknowledgeWithinMinutes()));
        complaint.setResolveDueAt(base.plusMinutes(rule.getResolveWithinMinutes()));
    }

    public void recomputeForPriority(ComplaintEntity complaint, PriorityLevel priority) {
        complaint.setPriority(priority);
        applyInitialSla(complaint);
    }

    public boolean isAcknowledgeOverdue(ComplaintEntity complaint) {
        if (complaint.getAcknowledgeDueAt() == null) return false;
        if (!(complaint.getStatus() == ComplaintStatus.NEW || complaint.getStatus() == ComplaintStatus.REOPENED)) return false;
        return complaint.getAcknowledgeDueAt().isBefore(OffsetDateTime.now(clock));
    }

    public boolean isResolveOverdue(ComplaintEntity complaint) {
        if (complaint.getResolveDueAt() == null) return false;
        if (complaint.getStatus() == ComplaintStatus.RESOLVED || complaint.getStatus() == ComplaintStatus.CLOSED) return false;
        return complaint.getResolveDueAt().isBefore(OffsetDateTime.now(clock));
    }

    public OffsetDateTime now() {
        return OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC);
    }
}
