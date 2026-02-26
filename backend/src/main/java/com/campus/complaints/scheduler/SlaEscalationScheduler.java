package com.campus.complaints.scheduler;

import com.campus.complaints.domain.complaint.ComplaintStatus;
import com.campus.complaints.domain.complaint.ComplaintRepository;
import com.campus.complaints.domain.sla.EscalationLevel;
import com.campus.complaints.domain.sla.EscalationService;
import com.campus.complaints.domain.user.RoleType;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaEscalationScheduler {

    private final ComplaintRepository complaintRepository;
    private final EscalationService escalationService;

    @Scheduled(fixedDelayString = "${app.sla-check-interval-ms:60000}")
    @Transactional
    public void checkOverdues() {
        OffsetDateTime now = OffsetDateTime.now();
        List<ComplaintStatus> unresolved = List.of(ComplaintStatus.NEW, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.NEEDS_INFO, ComplaintStatus.REOPENED);

        complaintRepository.findAcknowledgeOverdue(now, List.of(ComplaintStatus.NEW, ComplaintStatus.REOPENED))
                .forEach(c -> escalationService.createIfAbsent(c, EscalationLevel.ACKNOWLEDGE_OVERDUE,
                        "Acknowledge SLA breached", RoleType.ROLE_DEPT_ADMIN));

        complaintRepository.findResolveOverdue(now, unresolved)
                .forEach(c -> escalationService.createIfAbsent(c, EscalationLevel.RESOLVE_OVERDUE,
                        "Resolve SLA breached", RoleType.ROLE_SUPER_ADMIN));
    }
}
