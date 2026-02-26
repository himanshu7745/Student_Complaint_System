package com.campus.complaints.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private double predictionThreshold = 0.72;
    private final Jwt jwt = new Jwt();
    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Jwt {
        @NotBlank
        private String issuer;
        @NotBlank
        private String secret;
        private long accessTokenMinutes = 120;
    }

    @Getter
    @Setter
    public static class Cors {
        @NotEmpty
        private List<String> allowedOrigins = new ArrayList<>();
    }
}
