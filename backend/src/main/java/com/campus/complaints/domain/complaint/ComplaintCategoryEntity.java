package com.campus.complaints.domain.complaint;

import com.campus.complaints.domain.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "complaint_categories")
public class ComplaintCategoryEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    private ComplaintEntity complaint;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintCategoryType category;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(nullable = false)
    private Double confidence;
}
