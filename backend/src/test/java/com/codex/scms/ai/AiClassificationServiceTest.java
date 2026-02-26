package com.codex.scms.ai;

import com.codex.scms.config.AppProperties;
import com.codex.scms.domain.entity.Department;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.repository.DepartmentRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiClassificationServiceTest {

    @Mock
    private RestTemplate restTemplate;
    @Mock
    private DepartmentRepository departmentRepository;

    private AiClassificationService aiClassificationService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties();
        props.getAi().setBaseUrl("http://localhost:9000");
        props.getAi().setEndpoint("/classify");
        props.getAi().setTimeoutMs(2000);
        aiClassificationService = new AiClassificationService(restTemplate, new ObjectMapper(), props, departmentRepository);
    }

    @Test
    void classify_shouldParseSeverityAndDepartmentSuggestion() {
        Department dept = new Department();
        dept.setName("Electrical");
        when(restTemplate.postForEntity(eq("http://localhost:9000/classify"), any(), eq(String.class)))
            .thenReturn(new ResponseEntity<>("{\"severity\":\"HIGH\",\"departmentSuggestion\":\"Electrical\"}", HttpStatus.OK));
        when(departmentRepository.findByNameIgnoreCase("Electrical")).thenReturn(Optional.of(dept));

        AiClassificationService.AiClassificationResult result = aiClassificationService.classify(
            "Power outage",
            "No electricity in hostel block",
            "Hostel A",
            LocalDate.now(),
            List.of("https://img.example/1.png")
        );

        assertThat(result.severity()).isEqualTo(ComplaintSeverity.HIGH);
        assertThat(result.suggestedDepartment()).isEqualTo(dept);
        assertThat(result.fallbackUsed()).isFalse();
        assertThat(result.rawResponseJson()).contains("HIGH");
    }

    @Test
    void classify_shouldFallbackToMediumWhenAiCallFails() {
        when(restTemplate.postForEntity(any(String.class), any(), eq(String.class)))
            .thenThrow(new RuntimeException("timeout"));

        AiClassificationService.AiClassificationResult result = aiClassificationService.classify(
            "Issue",
            "desc",
            "area",
            LocalDate.now(),
            List.of()
        );

        assertThat(result.severity()).isEqualTo(ComplaintSeverity.MEDIUM);
        assertThat(result.suggestedDepartment()).isNull();
        assertThat(result.fallbackUsed()).isTrue();
        assertThat(result.errorMessage()).contains("timeout");
    }
}
