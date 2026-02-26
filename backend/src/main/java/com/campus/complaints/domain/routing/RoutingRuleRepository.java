package com.campus.complaints.domain.routing;

import com.campus.complaints.domain.complaint.ComplaintCategoryType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutingRuleRepository extends JpaRepository<RoutingRuleEntity, Long> {
    List<RoutingRuleEntity> findByActiveTrueOrderByCategoryAscCreatedAtAsc();
    List<RoutingRuleEntity> findByCategoryAndActiveTrue(ComplaintCategoryType category);
}
