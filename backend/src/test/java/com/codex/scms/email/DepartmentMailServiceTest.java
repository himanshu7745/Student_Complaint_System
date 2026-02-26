package com.codex.scms.email;

import com.codex.scms.config.AppProperties;
import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.entity.Department;
import com.codex.scms.security.JwtService;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DepartmentMailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;
    @Mock
    private JwtService jwtService;
    @Mock
    private EmailTemplateService emailTemplateService;

    private DepartmentMailService departmentMailService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties();
        props.getPublicUrls().setBackendBaseUrl("http://localhost:8080");
        props.getPublicUrls().setFrontendBaseUrl("http://localhost:5173");
        departmentMailService = new DepartmentMailService(javaMailSender, jwtService, props, emailTemplateService);
    }

    @Test
    void sendAssignmentEmail_shouldGenerateAckLinkAndSendHtmlMail() {
        Complaint complaint = new Complaint();
        complaint.setId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        Department department = new Department();
        department.setAuthorityEmail("electrical@example.edu");
        complaint.setAssignedDepartment(department);

        when(jwtService.generateAcknowledgementToken(complaint.getId())).thenReturn("ack-token");
        when(emailTemplateService.renderDepartmentAssignmentEmail(any(), any(), any())).thenReturn("<html>ok</html>");
        when(javaMailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));

        departmentMailService.sendAssignmentEmail(complaint);

        verify(emailTemplateService).renderDepartmentAssignmentEmail(any(), any(), any());
        verify(javaMailSender).send(any(MimeMessage.class));
    }
}
