package com.campus.complaints.domain.complaint;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ComplaintRepository extends JpaRepository<ComplaintEntity, Long>, JpaSpecificationExecutor<ComplaintEntity> {
    Optional<ComplaintEntity> findByComplaintCode(String complaintCode);

    @Query("select c from ComplaintEntity c where c.needsReview = true and c.status in :statuses")
    Page<ComplaintEntity> findReviewQueue(@Param("statuses") List<ComplaintStatus> statuses, Pageable pageable);

    long countByStatusIn(List<ComplaintStatus> statuses);
    long countByNeedsReviewTrue();
    long countByOwnerUserIsNullAndStatusIn(List<ComplaintStatus> statuses);

    @Query("select c from ComplaintEntity c where c.priority = :priority and c.status in :statuses order by c.updatedAt desc")
    List<ComplaintEntity> findTop10ByPriorityAndStatusInOrderByUpdatedAtDesc(@Param("priority") PriorityLevel priority,
                                                                             @Param("statuses") List<ComplaintStatus> statuses,
                                                                             Pageable pageable);

    @Query("select c from ComplaintEntity c where c.resolveDueAt < :now and c.status in :statuses")
    List<ComplaintEntity> findResolveOverdue(@Param("now") OffsetDateTime now, @Param("statuses") List<ComplaintStatus> statuses);

    @Query("select c from ComplaintEntity c where c.acknowledgeDueAt < :now and c.status in :statuses")
    List<ComplaintEntity> findAcknowledgeOverdue(@Param("now") OffsetDateTime now, @Param("statuses") List<ComplaintStatus> statuses);
}
