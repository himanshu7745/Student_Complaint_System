package com.campus.complaints.domain.sla;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.complaint.ComplaintEntity;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "escalations")
public class EscalationEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private ComplaintEntity complaint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EscalationLevel level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalated_to_user_id")
    private UserEntity escalatedToUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "escalated_to_role")
    private RoleType escalatedToRole;

    @Column(nullable = false, columnDefinition = "text")
    private String reason;
}
