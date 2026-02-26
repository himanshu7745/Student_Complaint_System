package com.codex.scms.email;

import com.codex.scms.domain.entity.Complaint;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

@Service
public class EmailTemplateService {

    private final ResourceLoader resourceLoader;
    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withZone(ZoneId.systemDefault());

    public EmailTemplateService(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public String renderDepartmentAssignmentEmail(Complaint complaint, String complaintRef, String ackUrl) {
        String template = loadTemplate("classpath:templates/department-assignment-email.html");
        String images = complaint.getImages().stream()
            .map(i -> "<li><a href=\"" + i.getImageUrl() + "\">" + i.getImageUrl() + "</a></li>")
            .collect(Collectors.joining());
        if (images.isBlank()) {
            images = "<li>No images attached.</li>";
        }

        return template
            .replace("{{COMPLAINT_REF}}", complaintRef)
            .replace("{{TITLE}}", escapeHtml(complaint.getTitle()))
            .replace("{{DESCRIPTION}}", escapeHtml(complaint.getDescription()))
            .replace("{{AREA}}", escapeHtml(complaint.getArea()))
            .replace("{{COMPLAINT_DATE}}", complaint.getComplaintDate().toString())
            .replace("{{SEVERITY}}", complaint.getAiSeverity().name())
            .replace("{{SLA_DUE_AT}}", complaint.getSlaDueAt() == null ? "TBD" : formatter.format(complaint.getSlaDueAt()))
            .replace("{{ACK_URL}}", ackUrl)
            .replace("{{IMAGE_LIST}}", images);
    }

    private String loadTemplate(String location) {
        Resource resource = resourceLoader.getResource(location);
        try {
            return new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load email template", e);
        }
    }

    private String escapeHtml(String value) {
        return value == null ? "" : value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
