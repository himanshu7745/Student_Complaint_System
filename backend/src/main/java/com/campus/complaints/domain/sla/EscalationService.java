package com.campus.complaints.domain.sla;

import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.domain.complaint.TimelineEventType;
import com.campus.complaints.domain.complaint.TimelineService;
import com.campus.complaints.domain.user.RoleType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EscalationService {

    private final EscalationRepository escalationRepository;
    private final TimelineService timelineService;

    @Transactional
    public void createIfAbsent(ComplaintEntity complaint, EscalationLevel level, String reason, RoleType escalatedToRole) {
        if (escalationRepository.existsByComplaintIdAndLevel(complaint.getId(), level)) {
            return;
        }
        EscalationEntity escalation = new EscalationEntity();
        escalation.setComplaint(complaint);
        escalation.setLevel(level);
        escalation.setReason(reason);
        escalation.setEscalatedToRole(escalatedToRole);
        escalationRepository.save(escalation);
        timelineService.add(complaint, TimelineEventType.ESCALATED, null, level.name(), null, reason);
    }
}
