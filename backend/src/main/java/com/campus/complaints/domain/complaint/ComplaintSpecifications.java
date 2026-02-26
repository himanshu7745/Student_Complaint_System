package com.campus.complaints.domain.complaint;

import jakarta.persistence.criteria.JoinType;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class ComplaintSpecifications {
    private ComplaintSpecifications() {}

    public static Specification<ComplaintEntity> filter(
            Boolean mine,
            Long currentUserId,
            String status,
            List<String> categories,
            String priority,
            String q,
            OffsetDateTime from,
            OffsetDateTime to,
            String assignedTo,
            String location,
            Boolean needsReview,
            String confidenceLevel,
            boolean adminMode
    ) {
        return (root, query, cb) -> {
            query.distinct(true);
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (Boolean.TRUE.equals(mine) && currentUserId != null) {
                predicates.add(cb.equal(root.join("createdBy").get("id"), currentUserId));
            }

            if (StringUtils.hasText(status)) {
                predicates.add(cb.equal(root.get("status"), ComplaintStatus.valueOf(status)));
            }

            if (StringUtils.hasText(priority)) {
                predicates.add(cb.equal(root.get("priority"), PriorityLevel.valueOf(priority)));
            }

            if (StringUtils.hasText(q)) {
                String like = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("complaintCode")), like),
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("description")), like)
                ));
            }

            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }

            if (StringUtils.hasText(location)) {
                String like = "%" + location.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("hostelName"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("buildingName"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("roomName"), "")), like)
                ));
            }

            if (needsReview != null) {
                predicates.add(cb.equal(root.get("needsReview"), needsReview));
            }

            if (StringUtils.hasText(assignedTo)) {
                if ("UNASSIGNED".equalsIgnoreCase(assignedTo)) {
                    predicates.add(cb.isNull(root.get("ownerUser")));
                } else {
                    predicates.add(cb.equal(cb.lower(root.join("ownerUser", JoinType.LEFT).get("name")), assignedTo.toLowerCase()));
                }
            }

            if (categories != null && !categories.isEmpty()) {
                for (String category : categories) {
                    var categoryJoin = root.join("categories", JoinType.INNER);
                    predicates.add(cb.equal(categoryJoin.get("category"), ComplaintCategoryType.valueOf(category)));
                }
            }

            // Confidence-level filtering is applied in the service layer using latest prediction rows.

            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
