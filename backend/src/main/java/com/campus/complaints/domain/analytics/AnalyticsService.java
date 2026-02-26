package com.campus.complaints.domain.analytics;

import com.campus.complaints.domain.admin.api.AdminDtos;
import com.campus.complaints.domain.complaint.ComplaintCategoryEntity;
import com.campus.complaints.domain.complaint.ComplaintRepository;
import com.campus.complaints.domain.complaint.ComplaintStatus;
import com.campus.complaints.domain.sla.SlaService;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserAccessService;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ComplaintRepository complaintRepository;
    private final com.campus.complaints.domain.complaint.ComplaintCategoryRepository complaintCategoryRepository;
    private final UserAccessService userAccessService;
    private final SlaService slaService;

    @Transactional(readOnly = true)
    public AdminDtos.InboxSummaryDTO summary() {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_REVIEWER, RoleType.ROLE_SUPER_ADMIN);
        List<ComplaintStatus> open = List.of(ComplaintStatus.NEW, ComplaintStatus.ACKNOWLEDGED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.NEEDS_INFO, ComplaintStatus.REOPENED);
        long openCount = complaintRepository.countByStatusIn(open);
        long unassigned = complaintRepository.countByOwnerUserIsNullAndStatusIn(open);
        long manual = complaintRepository.countByNeedsReviewTrue();
        long breaches = complaintRepository.findResolveOverdue(slaService.now(), open).size();

        var all = complaintRepository.findAll();
        var resolved = all.stream().filter(c -> c.getResolvedAt() != null || c.getClosedAt() != null).toList();
        long avgHours = resolved.isEmpty() ? 0 : Math.round(resolved.stream().mapToLong(c -> {
            var end = c.getClosedAt() != null ? c.getClosedAt() : c.getResolvedAt();
            return java.time.Duration.between(c.getCreatedAt(), end).toHours();
        }).average().orElse(0));
        return new AdminDtos.InboxSummaryDTO(openCount, unassigned, breaches, avgHours, manual);
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.TrendPointDTO> trends(int days) {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_REVIEWER, RoleType.ROLE_SUPER_ADMIN);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, Long> created = new LinkedHashMap<>();
        Map<LocalDate, Long> resolved = new LinkedHashMap<>();
        for (int i = days - 1; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            created.put(d, 0L);
            resolved.put(d, 0L);
        }
        complaintRepository.findAll().forEach(c -> {
            LocalDate createdDate = c.getCreatedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
            if (created.containsKey(createdDate)) created.put(createdDate, created.get(createdDate) + 1);
            if (c.getResolvedAt() != null) {
                LocalDate rd = c.getResolvedAt().atZoneSameInstant(ZoneOffset.UTC).toLocalDate();
                if (resolved.containsKey(rd)) resolved.put(rd, resolved.get(rd) + 1);
            }
        });
        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        return created.keySet().stream().map(d -> new AdminDtos.TrendPointDTO(fmt.format(d), created.get(d), resolved.get(d))).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.CategoryMetricDTO> byCategory() {
        userAccessService.assertAnyRole(RoleType.ROLE_RESOLVER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_REVIEWER, RoleType.ROLE_SUPER_ADMIN);
        Map<String, Long> counts = new HashMap<>();
        complaintRepository.findAll().forEach(c -> {
            List<ComplaintCategoryEntity> cats = complaintCategoryRepository.findByComplaintIdOrderByPrimaryDescConfidenceDesc(c.getId());
            cats.forEach(cat -> counts.merge(cat.getCategory().name(), 1L, Long::sum));
        });
        return counts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> new AdminDtos.CategoryMetricDTO(e.getKey(), e.getValue())).toList();
    }
}
