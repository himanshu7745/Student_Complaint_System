package com.codex.scms.complaint;

import com.codex.scms.ai.AiClassificationService;
import com.codex.scms.common.AppException;
import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.entity.User;
import com.codex.scms.domain.enums.ComplaintStatus;
import com.codex.scms.domain.enums.UserRole;
import com.codex.scms.email.DepartmentMailService;
import com.codex.scms.repository.ComplaintEventRepository;
import com.codex.scms.repository.ComplaintRepository;
import com.codex.scms.repository.DepartmentRepository;
import com.codex.scms.repository.UserRepository;
import com.codex.scms.security.AuthenticatedUser;
import com.codex.scms.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ComplaintTransitionServiceTest {

    @Mock private ComplaintRepository complaintRepository;
    @Mock private ComplaintEventRepository complaintEventRepository;
    @Mock private UserRepository userRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private ComplaintMapper complaintMapper;
    @Mock private AiClassificationService aiClassificationService;
    @Mock private DepartmentMailService departmentMailService;
    @Mock private JwtService jwtService;

    private ComplaintService complaintService;

    @BeforeEach
    void setUp() {
        complaintService = new ComplaintService(
            complaintRepository,
            complaintEventRepository,
            userRepository,
            departmentRepository,
            complaintMapper,
            aiClassificationService,
            departmentMailService,
            jwtService
        );
    }

    @Test
    void markResolved_shouldCloseComplaintAfterAck() {
        UUID complaintId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        User student = new User();
        student.setId(studentId);
        Complaint complaint = new Complaint();
        complaint.setId(complaintId);
        complaint.setStudent(student);
        complaint.setStatus(ComplaintStatus.ACK_RECEIVED);

        AuthenticatedUser principal = new AuthenticatedUser(studentId, "Test", "test@example.com", "hash", UserRole.STUDENT);

        when(complaintRepository.findWithDetailsById(complaintId)).thenReturn(Optional.of(complaint));
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(inv -> inv.getArgument(0));
        when(complaintMapper.toDetail(any(Complaint.class))).thenReturn(null);

        complaintService.markResolved(principal, complaintId, new ComplaintDtos.MarkResolvedRequest("done"));

        ArgumentCaptor<Complaint> captor = ArgumentCaptor.forClass(Complaint.class);
        org.mockito.Mockito.verify(complaintRepository).save(captor.capture());
        Complaint saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(ComplaintStatus.CLOSED);
        assertThat(saved.getStudentResolvedAt()).isNotNull();
        assertThat(saved.getEvents()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void escalate_shouldRequireOverdueOrDissatisfactionState() {
        UUID complaintId = UUID.randomUUID();
        UUID studentId = UUID.randomUUID();

        User student = new User();
        student.setId(studentId);
        Complaint complaint = new Complaint();
        complaint.setId(complaintId);
        complaint.setStudent(student);
        complaint.setStatus(ComplaintStatus.EMAIL_SENT);
        complaint.setSlaDueAt(Instant.now().plusSeconds(3600));

        AuthenticatedUser principal = new AuthenticatedUser(studentId, "Test", "test@example.com", "hash", UserRole.STUDENT);
        when(complaintRepository.findWithDetailsById(complaintId)).thenReturn(Optional.of(complaint));

        assertThatThrownBy(() -> complaintService.escalateToDirector(principal, complaintId, new ComplaintDtos.EscalateComplaintRequest("escalate")))
            .isInstanceOf(AppException.class)
            .hasMessageContaining("overdue or after acknowledgement/action");
    }
}
