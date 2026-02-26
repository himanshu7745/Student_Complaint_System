package com.campus.complaints.domain.sla;

import com.campus.complaints.domain.complaint.PriorityLevel;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlaRuleRepository extends JpaRepository<SlaRuleEntity, Long> {
    Optional<SlaRuleEntity> findByPriorityAndActiveTrue(PriorityLevel priority);
    List<SlaRuleEntity> findByActiveTrueOrderByPriorityAsc();
}
