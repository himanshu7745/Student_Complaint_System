package com.codex.scms.email;

import com.codex.scms.config.AppProperties;
import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.security.JwtService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentMailService {

    private final JavaMailSender javaMailSender;
    private final JwtService jwtService;
    private final AppProperties appProperties;
    private final EmailTemplateService emailTemplateService;

    public void sendAssignmentEmail(Complaint complaint) {
        if (complaint.getAssignedDepartment() == null) {
            throw new IllegalArgumentException("Assigned department is required before sending email");
        }

        String token = jwtService.generateAcknowledgementToken(complaint.getId());
        String complaintRef = "CMP-" + complaint.getId();
        String ackLink = appProperties.getPublicUrls().getBackendBaseUrl()
            + "/api/complaints/" + complaint.getId() + "/acknowledge-link?token=" + token;
        String html = emailTemplateService.renderDepartmentAssignmentEmail(complaint, complaintRef, ackLink);

        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(complaint.getAssignedDepartment().getAuthorityEmail());
            helper.setSubject("[" + complaintRef + "] Student Complaint Assigned - Action Required");
            helper.setText(html, true);
            javaMailSender.send(mimeMessage);
        } catch (MessagingException ex) {
            log.error("Failed to prepare complaint email for complaint {}", complaint.getId(), ex);
            throw new IllegalStateException("Failed to prepare complaint email", ex);
        } catch (MailSendException ex) {
            log.error("Failed to send complaint email for complaint {}", complaint.getId(), ex);
            throw ex;
        }
    }
}
