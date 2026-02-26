package com.campus.complaints.domain.review;

import com.campus.complaints.common.api.PagedResponse;
import com.campus.complaints.domain.admin.api.AdminDtos;
import com.campus.complaints.domain.admin.api.AdminMapper;
import com.campus.complaints.domain.complaint.*;
import com.campus.complaints.domain.prediction.ComplaintPredictionRepository;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserAccessService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManualReviewQueryService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintCategoryRepository complaintCategoryRepository;
    private final ComplaintPredictionRepository complaintPredictionRepository;
    private final ComplaintAssignmentRepository complaintAssignmentRepository;
    private final AdminMapper adminMapper;
    private final UserAccessService userAccessService;

    @Transactional(readOnly = true)
    public PagedResponse<AdminDtos.ReviewQueueItemDTO> getReviewQueue(Integer page, Integer size) {
        userAccessService.assertAnyRole(RoleType.ROLE_REVIEWER, RoleType.ROLE_DEPT_ADMIN, RoleType.ROLE_SUPER_ADMIN);
        var pageable = PageRequest.of(page == null ? 0 : page, size == null ? 20 : Math.min(size, 100), Sort.by(Sort.Direction.DESC, "updatedAt"));
        var data = complaintRepository.findReviewQueue(List.of(ComplaintStatus.NEW, ComplaintStatus.REOPENED, ComplaintStatus.ACKNOWLEDGED), pageable)
                .map(c -> adminMapper.toReviewQueueItem(
                        c,
                        complaintPredictionRepository.findTopByComplaintIdOrderByPredictedAtDesc(c.getId()).orElse(null),
                        complaintCategoryRepository.findByComplaintIdOrderByPrimaryDescConfidenceDesc(c.getId()),
                        complaintAssignmentRepository.findByComplaintId(c.getId())));
        return PagedResponse.from(data);
    }
}
