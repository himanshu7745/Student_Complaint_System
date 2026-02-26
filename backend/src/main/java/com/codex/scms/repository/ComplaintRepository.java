package com.codex.scms.repository;

import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.enums.ComplaintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID>, JpaSpecificationExecutor<Complaint> {

    @EntityGraph(attributePaths = {
        "student", "aiDepartment", "assignedDepartment", "assignedByAdmin"
    })
    @Query("select distinct c from Complaint c where c.id = :id")
    Optional<Complaint> findWithDetailsById(UUID id);

    @EntityGraph(attributePaths = {
        "student", "aiDepartment", "assignedDepartment", "assignedByAdmin"
    })
    Page<Complaint> findAllByStudent_Id(UUID studentId, Pageable pageable);

    List<Complaint> findByStatusAndSlaDueAtBeforeAndAckReceivedAtIsNull(ComplaintStatus status, Instant now);

    long countByStatus(ComplaintStatus status);

    long countByStudent_Id(UUID studentId);
}
