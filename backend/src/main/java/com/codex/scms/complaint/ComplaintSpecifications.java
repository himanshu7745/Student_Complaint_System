package com.codex.scms.complaint;

import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.domain.enums.ComplaintStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public final class ComplaintSpecifications {
    private ComplaintSpecifications() {}

    public static Specification<Complaint> studentScoped(UUID studentId) {
        return (root, query, cb) -> cb.equal(root.get("student").get("id"), studentId);
    }

    public static Specification<Complaint> hasStatus(ComplaintStatus status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Complaint> hasSeverity(ComplaintSeverity severity) {
        return severity == null ? null : (root, query, cb) -> cb.equal(root.get("aiSeverity"), severity);
    }

    public static Specification<Complaint> hasDepartment(UUID departmentId) {
        return departmentId == null ? null : (root, query, cb) -> cb.equal(root.get("assignedDepartment").get("id"), departmentId);
    }

    public static Specification<Complaint> dateBetween(LocalDate from, LocalDate to) {
        if (from == null && to == null) return null;
        return (root, query, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("complaintDate"), from, to);
            }
            if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("complaintDate"), from);
            }
            return cb.lessThanOrEqualTo(root.get("complaintDate"), to);
        };
    }

    public static Specification<Complaint> search(String q) {
        if (q == null || q.isBlank()) return null;
        String like = "%" + q.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
            cb.like(cb.lower(root.get("title")), like),
            cb.like(cb.lower(root.get("description")), like),
            cb.like(cb.lower(root.get("area")), like),
            cb.like(cb.lower(root.get("student").get("name")), like),
            cb.like(cb.lower(root.get("student").get("email")), like)
        );
    }
}
