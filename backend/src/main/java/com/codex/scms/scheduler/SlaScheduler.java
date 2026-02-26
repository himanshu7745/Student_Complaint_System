package com.codex.scms.scheduler;

import com.codex.scms.complaint.ComplaintService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaScheduler {

    private final ComplaintService complaintService;

    @Scheduled(cron = "${app.sla.scheduler-cron:0 0 * * * *}")
    public void flagOverdueComplaints() {
        int flagged = complaintService.flagOverdueComplaints();
        if (flagged > 0) {
            log.info("SLA scheduler flagged {} overdue complaints", flagged);
        }
    }
}
