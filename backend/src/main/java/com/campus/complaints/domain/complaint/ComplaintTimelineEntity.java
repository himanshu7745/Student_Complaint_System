package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaint_timeline")
public class ComplaintTimelineEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private ComplaintEntity complaint;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private TimelineEventType eventType;

    @Column(name = "old_value", columnDefinition = "text")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "text")
    private String newValue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private UserEntity actor;

    @Column(columnDefinition = "text")
    private String detail;
}
