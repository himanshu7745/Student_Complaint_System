package com.campus.complaints.domain.sla;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.complaint.PriorityLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sla_rules")
public class SlaRuleEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PriorityLevel priority;

    @Column(name = "acknowledge_within_minutes", nullable = false)
    private Integer acknowledgeWithinMinutes;

    @Column(name = "resolve_within_minutes", nullable = false)
    private Integer resolveWithinMinutes;

    @Column(nullable = false)
    private boolean active = true;
}
