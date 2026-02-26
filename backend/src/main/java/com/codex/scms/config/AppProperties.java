package com.codex.scms.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Data
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private Cors cors = new Cors();
    private Jwt jwt = new Jwt();
    private PublicUrls publicUrls = new PublicUrls();
    private Ai ai = new Ai();
    private Imgbb imgbb = new Imgbb();
    private Sla sla = new Sla();

    @Data
    public static class Cors {
        private List<String> allowedOrigins = new ArrayList<>();
    }

    @Data
    public static class Jwt {
        @NotBlank
        private String secret;
        @Min(1)
        private long accessTokenExpirationMinutes = 120;
        @Min(1)
        private long ackTokenExpirationHours = 240;
    }

    @Data
    public static class PublicUrls {
        @NotBlank
        private String frontendBaseUrl;
        @NotBlank
        private String backendBaseUrl;
    }

    @Data
    public static class Ai {
        // Intentionally not @NotBlank: runtime code falls back to Gemini defaults if blank/null.
        private String baseUrl = "https://generativelanguage.googleapis.com";
        private String endpoint = "/v1/models/gemini-2.5-flash:generateContent";
        @Min(100)
        private int timeoutMs = 5000;
        private String apiKey;
        private String authHeaderName = "X-API-Key";
    }

    @Data
    public static class Imgbb {
        @NotBlank
        private String baseUrl;
        @NotBlank
        private String apiKey;
        private long expirationSeconds = 0;
        private int maxImageCount = 5;
        private long maxImageSizeBytes = 5 * 1024 * 1024;
        @NotEmpty
        private List<String> allowedMimeTypes = new ArrayList<>(List.of("image/jpeg", "image/png", "image/webp"));
    }

    @Data
    public static class Sla {
        @NotBlank
        private String schedulerCron = "0 0 * * * *";
    }
}
