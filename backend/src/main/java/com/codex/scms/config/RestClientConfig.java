package com.codex.scms.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder, AppProperties appProperties) {
        Duration timeout = Duration.ofMillis(appProperties.getAi().getTimeoutMs());
        return builder
            .setConnectTimeout(timeout)
            .setReadTimeout(timeout)
            .build();
    }
}
