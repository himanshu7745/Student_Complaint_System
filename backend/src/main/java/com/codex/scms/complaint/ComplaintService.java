package com.codex.scms.complaint;

import com.codex.scms.ai.AiClassificationService;
import com.codex.scms.common.AppException;
import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.entity.ComplaintEvent;
import com.codex.scms.domain.entity.ComplaintImage;
import com.codex.scms.domain.entity.Department;
import com.codex.scms.domain.entity.User;
import com.codex.scms.domain.enums.ComplaintEventType;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.domain.enums.ComplaintStatus;
import com.codex.scms.domain.enums.EventActorType;
import com.codex.scms.domain.enums.UserRole;
import com.codex.scms.email.DepartmentMailService;
import com.codex.scms.repository.ComplaintEventRepository;
import com.codex.scms.repository.ComplaintRepository;
import com.codex.scms.repository.DepartmentRepository;
import com.codex.scms.repository.UserRepository;
import com.codex.scms.security.AuthenticatedUser;
import com.codex.scms.security.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

import static org.springframework.data.jpa.domain.Specification.where;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComplaintService {

    private static final String OVERDUE_MARKER = "SLA overdue flagged by scheduler";

    private final ComplaintRepository complaintRepository;
    private final ComplaintEventRepository complaintEventRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final ComplaintMapper complaintMapper;
    private final AiClassificationService aiClassificationService;
    private final DepartmentMailService departmentMailService;
    private final JwtService jwtService;

    @Transactional
    public ComplaintDtos.ComplaintResponse createComplaint(AuthenticatedUser authUser, ComplaintDtos.CreateComplaintRequest request) {
        if (request.images() != null && request.images().size() > 5) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Maximum 5 images allowed");
        }
        User student = getUser(authUser.getId());

        Complaint complaint = new Complaint();
        complaint.setStudent(student);
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setArea(request.area().trim());
        complaint.setComplaintDate(request.complaintDate());
        complaint.setAiSeverity(ComplaintSeverity.MEDIUM);
        complaint.setStatus(ComplaintStatus.NEW);

        if (request.images() != null) {
            for (ComplaintDtos.UploadedImageInput img : request.images()) {
                ComplaintImage image = new ComplaintImage();
                image.setImageUrl(img.url().trim());
                image.setDeleteHash((img.deleteHash() == null || img.deleteHash().isBlank()) ? null : img.deleteHash().trim());
                complaint.addImage(image);
            }
        }

        addEvent(complaint, ComplaintEventType.STATUS_CHANGE, EventActorType.STUDENT, "Complaint created with status NEW");
        complaint = complaintRepository.save(complaint);

        applyAiClassification(complaint);

        if (complaint.getAiDepartment() != null) {
            assignDepartmentInternal(complaint, complaint.getAiDepartment(), null, EventActorType.SYSTEM, "Auto-assigned by AI suggestion");
            try {
                sendDepartmentEmailAndStartSla(complaint, EventActorType.SYSTEM, false);
            } catch (MailException ex) {
                addEvent(complaint, ComplaintEventType.COMMENT, EventActorType.SYSTEM,
                    "Department assigned automatically, but email send failed: " + ex.getMessage());
            }
        } else {
            changeStatus(complaint, ComplaintStatus.PENDING_ADMIN_ASSIGNMENT, EventActorType.SYSTEM, "Awaiting admin department assignment");
        }

        Complaint saved = complaintRepository.save(complaint);
        return complaintMapper.toDetail(reloadDetailed(saved.getId()));
    }

    @Transactional(readOnly = true)
    public Page<ComplaintDtos.ComplaintListItemResponse> listStudentComplaints(
        AuthenticatedUser authUser,
        ComplaintStatus status,
        ComplaintSeverity severity,
        LocalDate fromDate,
        LocalDate toDate,
        UUID departmentId,
        String search,
        int page,
        int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Complaint> spec = where(ComplaintSpecifications.studentScoped(authUser.getId()))
            .and(ComplaintSpecifications.hasStatus(status))
            .and(ComplaintSpecifications.hasSeverity(severity))
            .and(ComplaintSpecifications.dateBetween(fromDate, toDate))
            .and(ComplaintSpecifications.hasDepartment(departmentId))
            .and(ComplaintSpecifications.search(search));

        return complaintRepository.findAll(spec, pageable).map(complaintMapper::toListItem);
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintResponse getStudentComplaint(AuthenticatedUser authUser, UUID complaintId) {
        Complaint complaint = reloadDetailed(complaintId);
        if (!complaint.getStudent().getId().equals(authUser.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "You can only access your own complaints");
        }
        return complaintMapper.toDetail(complaint);
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse markResolved(AuthenticatedUser authUser, UUID complaintId, ComplaintDtos.MarkResolvedRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        ensureStudentOwner(authUser, complaint);
        if (!(complaint.getStatus() == ComplaintStatus.ACK_RECEIVED || complaint.getStatus() == ComplaintStatus.ACTION_TAKEN)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Complaint can be marked resolved only after acknowledgement/action");
        }
        changeStatus(complaint, ComplaintStatus.RESOLVED_BY_STUDENT, EventActorType.STUDENT,
            blankToDefault(request.message(), "Student marked complaint as resolved"));
        complaint.setStudentResolvedAt(Instant.now());
        changeStatus(complaint, ComplaintStatus.CLOSED, EventActorType.SYSTEM, "Complaint closed after student confirmation");
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse escalateToDirector(AuthenticatedUser authUser, UUID complaintId, ComplaintDtos.EscalateComplaintRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        ensureStudentOwner(authUser, complaint);

        boolean overdue = complaintMapper.isOverdue(complaint);
        boolean allowedByDissatisfaction = complaint.getStatus() == ComplaintStatus.ACK_RECEIVED || complaint.getStatus() == ComplaintStatus.ACTION_TAKEN;
        if (!overdue && !allowedByDissatisfaction) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Escalation allowed only when overdue or after acknowledgement/action if unsatisfied");
        }

        complaint.setEscalatedAt(Instant.now());
        changeStatus(complaint, ComplaintStatus.ESCALATED_TO_DIRECTOR, EventActorType.STUDENT,
            blankToDefault(request.reason(), overdue ? "Escalated to Director due to SLA breach" : "Escalated to Director by student (unsatisfied)"));
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional(readOnly = true)
    public Page<ComplaintDtos.ComplaintListItemResponse> listAdminComplaints(
        ComplaintStatus status,
        ComplaintSeverity severity,
        LocalDate fromDate,
        LocalDate toDate,
        UUID departmentId,
        String search,
        int page,
        int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Specification<Complaint> spec = where(ComplaintSpecifications.hasStatus(status))
            .and(ComplaintSpecifications.hasSeverity(severity))
            .and(ComplaintSpecifications.dateBetween(fromDate, toDate))
            .and(ComplaintSpecifications.hasDepartment(departmentId))
            .and(ComplaintSpecifications.search(search));
        return complaintRepository.findAll(spec, pageable).map(complaintMapper::toListItem);
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.ComplaintResponse getAdminComplaint(UUID complaintId) {
        return complaintMapper.toDetail(reloadDetailed(complaintId));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse assignDepartment(AuthenticatedUser admin, UUID complaintId, ComplaintDtos.AssignDepartmentRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        Department department = getDepartment(request.departmentId());
        User adminUser = getUser(admin.getId());

        assignDepartmentInternal(complaint, department, adminUser, EventActorType.ADMIN,
            blankToDefault(request.note(), "Department assigned by admin"));
        try {
            sendDepartmentEmailAndStartSla(complaint, EventActorType.ADMIN, false);
        } catch (MailException ex) {
            addEvent(complaint, ComplaintEventType.COMMENT, EventActorType.SYSTEM,
                "Department assigned but email send failed: " + ex.getMessage());
        }
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse overrideAi(AuthenticatedUser admin, UUID complaintId, ComplaintDtos.OverrideAiRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        complaint.setAiSeverity(request.aiSeverity());
        if (request.aiDepartmentId() != null) {
            Department aiDept = getDepartment(request.aiDepartmentId());
            complaint.setAiDepartment(aiDept);
        }
        addEvent(complaint, ComplaintEventType.AI_CLASSIFIED, EventActorType.ADMIN,
            "AI classification overridden by admin (severity=" + request.aiSeverity().name() + ")");
        if (Boolean.TRUE.equals(request.resendEmailIfAssigned()) && complaint.getAssignedDepartment() != null) {
            sendDepartmentEmailAndStartSla(complaint, EventActorType.ADMIN, true);
        }
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse resendDepartmentEmail(UUID complaintId) {
        Complaint complaint = reloadDetailed(complaintId);
        if (complaint.getAssignedDepartment() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Complaint is not assigned to any department");
        }
        sendDepartmentEmailAndStartSla(complaint, EventActorType.ADMIN, true);
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse acknowledgeByToken(UUID complaintId, ComplaintDtos.AcknowledgeComplaintRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        try {
            if (!jwtService.isAcknowledgementTokenForComplaint(request.token(), complaintId)) {
                throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid acknowledgement token");
            }
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid acknowledgement token");
        }
        return acknowledgeInternal(complaint, EventActorType.SYSTEM, blankToDefault(request.message(), "Department acknowledged complaint"));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse manualAcknowledge(UUID complaintId, ComplaintDtos.ManualAcknowledgeRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        return acknowledgeInternal(complaint, EventActorType.ADMIN, blankToDefault(request.message(), "Acknowledgement marked by admin"));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse markActionTaken(UUID complaintId, ComplaintDtos.ActionTakenRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        if (complaint.getStatus() != ComplaintStatus.ACK_RECEIVED && complaint.getStatus() != ComplaintStatus.EMAIL_SENT) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Action taken can be marked only after email/acknowledgement");
        }
        changeStatus(complaint, ComplaintStatus.ACTION_TAKEN, EventActorType.ADMIN, request.message());
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional
    public ComplaintDtos.ComplaintResponse addInternalNote(UUID complaintId, ComplaintDtos.InternalNoteRequest request) {
        Complaint complaint = reloadDetailed(complaintId);
        addEvent(complaint, ComplaintEventType.COMMENT, EventActorType.ADMIN, request.message());
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    @Transactional(readOnly = true)
    public List<ComplaintDtos.ComplaintListItemResponse> listOverdueComplaints() {
        return complaintRepository.findByStatusAndSlaDueAtBeforeAndAckReceivedAtIsNull(ComplaintStatus.EMAIL_SENT, Instant.now())
            .stream().map(complaintMapper::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.StudentDashboardKpis studentDashboardKpis(AuthenticatedUser authUser) {
        List<Complaint> complaints = complaintRepository.findAll(where(ComplaintSpecifications.studentScoped(authUser.getId())));
        long total = complaints.size();
        long pending = complaints.stream().filter(c -> switch (c.getStatus()) {
            case NEW, AI_CLASSIFIED, PENDING_ADMIN_ASSIGNMENT, ASSIGNED_TO_DEPARTMENT, EMAIL_SENT, ACK_RECEIVED, ACTION_TAKEN -> true;
            default -> false;
        }).count();
        long assigned = complaints.stream().filter(c -> c.getAssignedDepartment() != null).count();
        long resolved = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.CLOSED || c.getStatus() == ComplaintStatus.RESOLVED_BY_STUDENT).count();
        long overdue = complaints.stream().filter(complaintMapper::isOverdue).count();
        return new ComplaintDtos.StudentDashboardKpis(total, pending, assigned, resolved, overdue);
    }

    @Transactional(readOnly = true)
    public ComplaintDtos.AdminDashboardKpis adminDashboardKpis() {
        long total = complaintRepository.count();
        long newCount = complaintRepository.countByStatus(ComplaintStatus.NEW);
        long pendingAssignment = complaintRepository.countByStatus(ComplaintStatus.PENDING_ADMIN_ASSIGNMENT);
        long closed = complaintRepository.countByStatus(ComplaintStatus.CLOSED);
        long overdue = complaintRepository.findByStatusAndSlaDueAtBeforeAndAckReceivedAtIsNull(ComplaintStatus.EMAIL_SENT, Instant.now()).size();
        return new ComplaintDtos.AdminDashboardKpis(total, newCount, pendingAssignment, overdue, closed);
    }

    @Transactional
    public int flagOverdueComplaints() {
        List<Complaint> overdueComplaints = complaintRepository.findByStatusAndSlaDueAtBeforeAndAckReceivedAtIsNull(ComplaintStatus.EMAIL_SENT, Instant.now());
        int flagged = 0;
        for (Complaint complaint : overdueComplaints) {
            boolean exists = complaintEventRepository.existsByComplaint_IdAndEventTypeAndMessageContaining(
                complaint.getId(), ComplaintEventType.COMMENT, OVERDUE_MARKER);
            if (!exists) {
                addEvent(complaint, ComplaintEventType.COMMENT, EventActorType.SYSTEM,
                    OVERDUE_MARKER + " (due=" + complaint.getSlaDueAt() + ")");
                complaintRepository.save(complaint);
                flagged++;
            }
        }
        return flagged;
    }

    public String acknowledgementLandingPage(UUID complaintId, String token) {
        String actionUrl = "/api/complaints/" + complaintId + "/acknowledge";
        return """
            <!doctype html>
            <html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
            <title>Acknowledge Complaint</title></head>
            <body style=\"font-family:Arial,sans-serif;padding:24px;max-width:720px;margin:0 auto;\">
              <h2>Department Acknowledgement</h2>
              <p>Complaint Reference: <strong>CMP-%s</strong></p>
              <form method=\"post\" action=\"%s\">
                <input type=\"hidden\" name=\"token\" value=\"%s\" />
                <label for=\"message\">Message (optional)</label><br/>
                <textarea id=\"message\" name=\"message\" rows=\"5\" style=\"width:100%%;max-width:100%%;margin:8px 0 12px;\"></textarea><br/>
                <button type=\"submit\" style=\"padding:10px 14px;\">Acknowledge Complaint</button>
              </form>
              <p style=\"color:#666;font-size:12px;margin-top:16px;\">This submits to the secure token endpoint.</p>
            </body></html>
            """.formatted(complaintId, actionUrl, token);
    }

    private void applyAiClassification(Complaint complaint) {
        changeStatus(complaint, ComplaintStatus.AI_CLASSIFIED, EventActorType.SYSTEM, "AI classification in progress/completed");
        AiClassificationService.AiClassificationResult result = aiClassificationService.classify(complaint);
        complaint.setAiSeverity(result.severity());
        complaint.setAiDepartment(result.suggestedDepartment());
        complaint.setAiRawResponseJson(result.rawResponseJson());

        String msg = "AI classified severity=" + result.severity().name();
        if (result.suggestedDepartment() != null) {
            msg += ", suggestedDepartment=" + result.suggestedDepartment().getName();
        }
        if (result.fallbackUsed()) {
            msg += " (fallback used" + (result.errorMessage() != null ? ": " + result.errorMessage() : "") + ")";
        }
        addEvent(complaint, ComplaintEventType.AI_CLASSIFIED, EventActorType.SYSTEM, msg);

        if (result.fallbackUsed() && result.suggestedDepartment() == null) {
            complaint.setStatus(ComplaintStatus.PENDING_ADMIN_ASSIGNMENT);
        }
    }

    private ComplaintDtos.ComplaintResponse acknowledgeInternal(Complaint complaint, EventActorType actor, String message) {
        if (complaint.getStatus() != ComplaintStatus.EMAIL_SENT && complaint.getStatus() != ComplaintStatus.ASSIGNED_TO_DEPARTMENT) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Complaint is not awaiting acknowledgement");
        }
        complaint.setAckReceivedAt(Instant.now());
        changeStatus(complaint, ComplaintStatus.ACK_RECEIVED, actor, message);
        addEvent(complaint, ComplaintEventType.ACK_RECEIVED, actor, message);
        return complaintMapper.toDetail(complaintRepository.save(complaint));
    }

    private void assignDepartmentInternal(Complaint complaint, Department department, User adminUser, EventActorType actor, String message) {
        complaint.setAssignedDepartment(department);
        complaint.setAssignedByAdmin(adminUser);
        changeStatus(complaint, ComplaintStatus.ASSIGNED_TO_DEPARTMENT, actor, "Department assigned: " + department.getName());
        addEvent(complaint, ComplaintEventType.ADMIN_ASSIGNED, actor, message + " -> " + department.getName());
    }

    private void sendDepartmentEmailAndStartSla(Complaint complaint, EventActorType actor, boolean resend) {
        if (complaint.getAssignedDepartment() == null) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Assign department before sending email");
        }

        departmentMailService.sendAssignmentEmail(complaint);
        Instant emailSentAt = Instant.now();
        complaint.setEmailSentAt(emailSentAt);
        complaint.setSlaDueAt(emailSentAt.plus(7, ChronoUnit.DAYS));
        complaint.setAckReceivedAt(null);
        changeStatus(complaint, ComplaintStatus.EMAIL_SENT, actor, resend ? "Department email resent" : "Department email sent and SLA started (7 days)");
        addEvent(complaint, ComplaintEventType.EMAIL_SENT, actor,
            (resend ? "Department email resent" : "Department email sent") + ", SLA due at " + complaint.getSlaDueAt());
    }

    private void ensureStudentOwner(AuthenticatedUser authUser, Complaint complaint) {
        if (!Objects.equals(complaint.getStudent().getId(), authUser.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "You can only modify your own complaints");
        }
    }

    private void changeStatus(Complaint complaint, ComplaintStatus newStatus, EventActorType actor, String message) {
        ComplaintStatus previous = complaint.getStatus();
        complaint.setStatus(newStatus);
        if (previous != newStatus) {
            addEvent(complaint, ComplaintEventType.STATUS_CHANGE, actor,
                "Status changed: " + previous + " -> " + newStatus + ". " + message);
        } else {
            addEvent(complaint, ComplaintEventType.STATUS_CHANGE, actor,
                "Status reaffirmed: " + newStatus + ". " + message);
        }
    }

    private void addEvent(Complaint complaint, ComplaintEventType type, EventActorType actor, String message) {
        ComplaintEvent event = new ComplaintEvent();
        event.setEventType(type);
        event.setCreatedBy(actor);
        event.setMessage(message);
        complaint.addEvent(event);
    }

    private Complaint reloadDetailed(UUID complaintId) {
        Complaint complaint = complaintRepository.findWithDetailsById(complaintId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Complaint not found"));
        // Avoid Hibernate multiple-bag fetch issues by initializing collections separately.
        complaint.getImages().size();
        complaint.getEvents().size();
        return complaint;
    }

    private Department getDepartment(UUID departmentId) {
        return departmentRepository.findById(departmentId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Department not found"));
    }

    private User getUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String blankToDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value.trim();
    }
}
