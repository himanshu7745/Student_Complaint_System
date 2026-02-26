package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaints")
public class ComplaintEntity extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String complaintCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ComplaintStatus status = ComplaintStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PriorityLevel priority = PriorityLevel.MEDIUM;

    @Column(name = "hostel_name")
    private String hostelName;

    @Column(name = "building_name")
    private String buildingName;

    @Column(name = "room_name")
    private String roomName;

    @Column(name = "preferred_visit_slot")
    private String preferredVisitSlot;

    @Column(nullable = false)
    private boolean anonymous = false;

    @Column(name = "needs_review", nullable = false)
    private boolean needsReview = false;

    @Column(name = "review_reason")
    private String reviewReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private UserEntity ownerUser;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "closed_at")
    private OffsetDateTime closedAt;

    @Column(name = "reopened_count", nullable = false)
    private int reopenedCount = 0;

    @Column(name = "acknowledge_due_at")
    private OffsetDateTime acknowledgeDueAt;

    @Column(name = "resolve_due_at")
    private OffsetDateTime resolveDueAt;

    @Column(name = "feedback_rating")
    private Integer feedbackRating;

    @Column(name = "feedback_comment", columnDefinition = "text")
    private String feedbackComment;

    @Column(name = "feedback_at")
    private OffsetDateTime feedbackAt;

    @Column(name = "campus_id")
    private String campusId;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintCategoryEntity> categories = new ArrayList<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComplaintAssignmentEntity> assignments = new ArrayList<>();
}
