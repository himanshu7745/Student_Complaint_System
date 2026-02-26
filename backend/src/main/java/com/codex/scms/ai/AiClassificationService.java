package com.codex.scms.ai;

import com.codex.scms.config.AppProperties;
import com.codex.scms.domain.entity.Complaint;
import com.codex.scms.domain.entity.Department;
import com.codex.scms.domain.enums.ComplaintSeverity;
import com.codex.scms.repository.DepartmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.StringJoiner;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClassificationService {

    // Retained to avoid breaking constructor/tests that already instantiate this service.
    @SuppressWarnings("unused")
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AppProperties appProperties;
    private final DepartmentRepository departmentRepository;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private static final int MAX_AI_IMAGES = 3;
    private static final int MAX_INLINE_IMAGE_BYTES = 2 * 1024 * 1024;

    public AiClassificationResult classify(String title, String description, String area, LocalDate complaintDate, List<String> imageUrls) {
        try {
            if (appProperties.getAi().getApiKey() == null || appProperties.getAi().getApiKey().isBlank()) {
                throw new IllegalStateException("AI_API_KEY is missing for Gemini classification");
            }

            String prompt = buildPrompt(title, description, area, complaintDate);
            String requestBody = buildGeminiRequest(prompt, imageUrls == null ? List.of() : imageUrls);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(buildGeminiUrl()))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofMillis(appProperties.getAi().getTimeoutMs()))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String rawBody = response.body();
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Gemini API returned HTTP " + response.statusCode() + ": " + rawBody);
            }

            JsonNode modelJson = parseGeminiModelOutput(rawBody);
            logAiJson(modelJson);

            String severityRaw = firstText(modelJson, "criticality", "severity", "aiSeverity");
            ComplaintSeverity severity = mapCriticalityToSeverity(severityRaw).orElse(ComplaintSeverity.MEDIUM);

            String deptName = firstText(modelJson, "department", "departmentSuggestion", "suggestedDepartment");
            Department suggestedDepartment = resolveDepartment(deptName).orElse(null);

            log.info(
                "AI extracted -> criticality='{}', mappedSeverity='{}', suggestedDepartment='{}', resolvedDepartment='{}'",
                severityRaw,
                severity,
                deptName,
                suggestedDepartment == null ? null : suggestedDepartment.getName()
            );

            if (deptName != null && !deptName.isBlank() && suggestedDepartment == null) {
                List<String> availableDepartments = departmentRepository.findAll().stream()
                    .map(Department::getName)
                    .sorted(String.CASE_INSENSITIVE_ORDER)
                    .toList();
                log.warn("AI department '{}' could not be mapped to any configured department. Available departments={}",
                    deptName, availableDepartments);
            }

            return new AiClassificationResult(severity, suggestedDepartment, rawBody, false, null);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            String error = "Gemini request interrupted";
            log.warn("AI classification failed, using fallback: {}", error, ex);
            return new AiClassificationResult(ComplaintSeverity.MEDIUM, null, null, true, error);
        } catch (Exception ex) {
            String error = (ex.getMessage() == null || ex.getMessage().isBlank())
                ? ex.getClass().getSimpleName()
                : ex.getMessage();
            log.warn("AI classification failed, using fallback: {}", error, ex);
            return new AiClassificationResult(ComplaintSeverity.MEDIUM, null, null, true, error);
        }
    }

    public AiClassificationResult classify(Complaint complaint) {
        List<String> imageUrls = complaint.getImages().stream().map(i -> i.getImageUrl()).toList();
        return classify(complaint.getTitle(), complaint.getDescription(), complaint.getArea(), complaint.getComplaintDate(), imageUrls);
    }

    private String buildGeminiRequest(String prompt, List<String> imageUrls) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");

        ObjectNode contentObj = contents.addObject();
        ArrayNode parts = contentObj.putArray("parts");

        parts.addObject().put("text", prompt);

        int attachedCount = 0;
        for (String url : imageUrls) {
            if (url == null || url.isBlank()) {
                continue;
            }
            if (attachedCount >= MAX_AI_IMAGES) {
                break;
            }

            // Gemini `file_data.file_uri` generally expects Google file URIs, not arbitrary public URLs.
            // For HTTP(S) URLs (like imgbb), fetch bytes and send as inline_data.
            if (url.startsWith("http://") || url.startsWith("https://")) {
                try {
                    if (tryAddInlineImagePart(parts, url)) {
                        attachedCount++;
                    }
                } catch (Exception imageEx) {
                    log.info("Skipping AI image {} due to fetch/encode error: {}", url, imageEx.getMessage());
                }
                continue;
            }

            ObjectNode imagePart = parts.addObject();
            ObjectNode fileData = imagePart.putObject("file_data");
            fileData.put("mime_type", mimeTypeFromUrl(url));
            fileData.put("file_uri", url);
            attachedCount++;
        }

        return objectMapper.writeValueAsString(root);
    }

    private boolean tryAddInlineImagePart(ArrayNode parts, String url) throws Exception {
        HttpRequest imageRequest = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .GET()
            .build();
        HttpResponse<byte[]> imageResponse = httpClient.send(imageRequest, HttpResponse.BodyHandlers.ofByteArray());
        if (imageResponse.statusCode() < 200 || imageResponse.statusCode() >= 300) {
            throw new IllegalStateException("Failed to fetch image for Gemini, HTTP " + imageResponse.statusCode());
        }
        byte[] bytes = imageResponse.body();
        if (bytes == null || bytes.length == 0) {
            throw new IllegalStateException("Fetched image is empty");
        }
        if (bytes.length > MAX_INLINE_IMAGE_BYTES) {
            log.info("Skipping AI image {} because size {} exceeds {} bytes", url, bytes.length, MAX_INLINE_IMAGE_BYTES);
            return false;
        }
        ObjectNode imagePart = parts.addObject();
        ObjectNode inlineData = imagePart.putObject("inline_data");
        inlineData.put("mime_type", mimeTypeFromUrl(url));
        inlineData.put("data", Base64.getEncoder().encodeToString(bytes));
        return true;
    }

    private String buildGeminiUrl() {
        String base = stripTrailingSlash(appProperties.getAi().getBaseUrl());
        String endpoint = appProperties.getAi().getEndpoint();
        if (endpoint == null || endpoint.isBlank()) {
            endpoint = "/v1/models/gemini-2.5-flash:generateContent";
        }
        if (!endpoint.startsWith("/")) {
            endpoint = "/" + endpoint;
        }
        String url = base + endpoint;
        String encodedKey = URLEncoder.encode(appProperties.getAi().getApiKey(), StandardCharsets.UTF_8);
        return url + (url.contains("?") ? "&" : "?") + "key=" + encodedKey;
    }

    private String buildPrompt(String title, String description, String area, LocalDate complaintDate) {
        return """
            You are an institutional complaint classifier.

            Departments:
            - Electrical
            - Plumbing
            - IT
            - Hostel Maintenance
            - Mess
            - Security
            - Harassment Response
            - Academic
            - Faculty
            - Administration

            Criticality Levels:
            1. Low
            2. Moderate
            3. High
            4. Critical

            Rules:
            - Harassment must be Critical.
            - Snake found is Critical.
            - Broken tap is Moderate.

            Return strictly valid JSON only (no markdown, no explanation):
            {
              "department": "... or null",
              "criticality": "Low|Moderate|High|Critical"
            }

            Complaint:
            Title: %s
            Description: %s
            Area: %s
            Complaint Date: %s
            """.formatted(
            safe(title),
            safe(description),
            safe(area),
            complaintDate == null ? "" : complaintDate
        );
    }

    private JsonNode parseGeminiModelOutput(String rawResponse) throws Exception {
        JsonNode root = objectMapper.readTree(rawResponse);
        if (root.has("error")) {
            throw new IllegalStateException("Gemini error: " + root.path("error").toString());
        }
        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IllegalStateException("Gemini response missing candidates");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new IllegalStateException("Gemini response missing content parts");
        }

        StringJoiner joiner = new StringJoiner("\n");
        for (JsonNode part : parts) {
            if (part.hasNonNull("text")) {
                joiner.add(part.get("text").asText());
            }
        }
        String modelOutput = joiner.toString().trim();
        if (modelOutput.isBlank()) {
            throw new IllegalStateException("Gemini response text is empty");
        }

        String sanitized = stripMarkdownJsonFence(modelOutput);
        return objectMapper.readTree(sanitized);
    }

    private void logAiJson(JsonNode modelJson) {
        try {
            String pretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(modelJson);
            log.info("AI parsed JSON response:\n{}", pretty);
        } catch (Exception ex) {
            log.info("AI parsed JSON response (compact): {}", modelJson);
        }
    }

    private String stripMarkdownJsonFence(String value) {
        String text = value.trim();
        if (text.startsWith("```") && text.endsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "");
            text = text.replaceFirst("\\s*```$", "");
        }
        return text.trim();
    }

    private Optional<ComplaintSeverity> mapCriticalityToSeverity(String value) {
        if (value == null || value.isBlank()) {
            return Optional.empty();
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        String alnum = normalized.replaceAll("[^A-Z0-9]+", " ").trim();

        if (alnum.matches(".*\\b4\\b.*") || alnum.contains("CRITICAL")) {
            return Optional.of(ComplaintSeverity.CRITICAL);
        }
        if (alnum.matches(".*\\b3\\b.*") || alnum.contains("HIGH")) {
            return Optional.of(ComplaintSeverity.HIGH);
        }
        if (alnum.matches(".*\\b2\\b.*") || alnum.contains("MODERATE") || alnum.contains("MEDIUM")) {
            return Optional.of(ComplaintSeverity.MEDIUM);
        }
        if (alnum.matches(".*\\b1\\b.*") || alnum.contains("LOW")) {
            return Optional.of(ComplaintSeverity.LOW);
        }

        return Optional.empty();
    }

    private Optional<Department> resolveDepartment(String deptName) {
        if (deptName == null || deptName.isBlank() || "null".equalsIgnoreCase(deptName.trim())) {
            return Optional.empty();
        }
        String name = deptName.trim();

        Optional<Department> direct = departmentRepository.findByNameIgnoreCase(name);
        if (direct.isPresent()) {
            return direct;
        }

        // Mild normalization for common model outputs vs. configured department names.
        String normalized = name.replace("Department", "").trim();
        direct = departmentRepository.findByNameIgnoreCase(normalized);
        if (direct.isPresent()) {
            return direct;
        }

        // Common aliases
        if ("HOSTEL MAINTENANCE".equalsIgnoreCase(name)) {
            return departmentRepository.findByNameIgnoreCase("Hostel");
        }
        if ("HARASSMENT RESPONSE".equalsIgnoreCase(name)) {
            return departmentRepository.findByNameIgnoreCase("Harassment");
        }
        if ("INFORMATION TECHNOLOGY".equalsIgnoreCase(name)) {
            return departmentRepository.findByNameIgnoreCase("IT");
        }

        String target = normalizeDepartmentLabel(name);
        if (target.isBlank()) {
            return Optional.empty();
        }
        return departmentRepository.findAll().stream()
            .min(Comparator.comparingInt(d -> departmentDistanceScore(normalizeDepartmentLabel(d.getName()), target)))
            .filter(d -> departmentDistanceScore(normalizeDepartmentLabel(d.getName()), target) <= 2);
    }

    private String normalizeDepartmentLabel(String value) {
        return value == null ? "" : value
            .toLowerCase(Locale.ROOT)
            .replace("&", "and")
            .replace("department", "")
            .replaceAll("[^a-z0-9]+", " ")
            .trim();
    }

    private int departmentDistanceScore(String candidate, String target) {
        if (candidate.equals(target)) return 0;
        if (candidate.contains(target) || target.contains(candidate)) return 1;
        if (candidate.startsWith(target) || target.startsWith(candidate)) return 1;
        // token overlap fallback for labels like "hostel maintenance" vs "hostel"
        int overlap = 0;
        for (String token : target.split(" ")) {
            if (!token.isBlank() && candidate.contains(token)) {
                overlap++;
            }
        }
        return overlap > 0 ? 2 : 100;
    }

    private String firstText(JsonNode node, String... fields) {
        for (String field : fields) {
            String direct = extractText(node.get(field));
            if (direct != null) {
                return direct;
            }
            JsonNode nested = node.path("data").get(field);
            String fromData = extractText(nested);
            if (fromData != null) {
                return fromData;
            }
            JsonNode classification = node.path("classification").get(field);
            String fromClassification = extractText(classification);
            if (fromClassification != null) {
                return fromClassification;
            }
        }
        return null;
    }

    private String extractText(JsonNode value) {
        if (value == null || value.isNull() || value.isMissingNode()) {
            return null;
        }
        if (value.isTextual() || value.isNumber() || value.isBoolean()) {
            String text = value.asText();
            return (text == null || text.isBlank()) ? null : text.trim();
        }
        if (value.isObject()) {
            for (String nestedKey : List.of("name", "label", "value", "department", "departmentName")) {
                if (value.has(nestedKey)) {
                    String nested = extractText(value.get(nestedKey));
                    if (nested != null) {
                        return nested;
                    }
                }
            }
        }
        return null;
    }

    private String mimeTypeFromUrl(String url) {
        String lower = url.toLowerCase();
        if (lower.contains(".png")) {
            return "image/png";
        }
        if (lower.contains(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    private String stripTrailingSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    public record AiClassificationResult(
        ComplaintSeverity severity,
        Department suggestedDepartment,
        String rawResponseJson,
        boolean fallbackUsed,
        String errorMessage
    ) {}
}
