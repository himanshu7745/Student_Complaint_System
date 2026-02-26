package com.codex.scms.domain.entity;

import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.domain.enums.ComplaintStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "complaints")
public class Complaint extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false, columnDefinition = "text")
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 255)
    private String area;

    @Column(name = "complaint_date", nullable = false)
    private LocalDate complaintDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_severity", nullable = false, length = 20)
    private ComplaintSeverity aiSeverity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_department_id")
    private Department aiDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_department_id")
    private Department assignedDepartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by_admin_id")
    private User assignedByAdmin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ComplaintStatus status;

    @Column(name = "email_sent_at")
    private Instant emailSentAt;

    @Column(name = "sla_due_at")
    private Instant slaDueAt;

    @Column(name = "ack_received_at")
    private Instant ackReceivedAt;

    @Column(name = "student_resolved_at")
    private Instant studentResolvedAt;

    @Column(name = "escalated_at")
    private Instant escalatedAt;

    @Column(name = "ai_raw_response_json", columnDefinition = "text")
    private String aiRawResponseJson;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ComplaintImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ComplaintEvent> events = new ArrayList<>();

    public void addImage(ComplaintImage image) {
        image.setComplaint(this);
        this.images.add(image);
    }

    public void addEvent(ComplaintEvent event) {
        event.setComplaint(this);
        this.events.add(event);
    }
}
