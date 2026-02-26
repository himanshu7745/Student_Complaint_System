package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.common.BaseEntity;
import com.campus.complaints.domain.user.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaint_messages")
public class ComplaintMessageEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private ComplaintEntity complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private UserEntity sender;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "is_internal", nullable = false)
    private boolean internal;
}
