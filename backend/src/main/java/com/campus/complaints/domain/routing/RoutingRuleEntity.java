package com.campus.complaints.domain.routing;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.complaint.ComplaintCategoryType;
import com.campus.complaints.domain.user.RoleType;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "routing_rules")
public class RoutingRuleEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategoryType category;

    @Column(name = "hostel_name")
    private String hostelName;

    @Column(name = "building_name")
    private String buildingName;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_role")
    private RoleType ownerRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private UserEntity ownerUser;

    @Column(name = "collaborator_roles", columnDefinition = "text")
    private String collaboratorRolesCsv;

    @Column(nullable = false)
    private boolean active = true;
}
