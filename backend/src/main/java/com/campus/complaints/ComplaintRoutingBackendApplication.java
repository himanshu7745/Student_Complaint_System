package com.campus.complaints;

import com.campus.complaints.config.AppProperties;
import com.campus.complaints.config.PredictionProperties;
import com.campus.complaints.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties({AppProperties.class, PredictionProperties.class, StorageProperties.class})
public class ComplaintRoutingBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(ComplaintRoutingBackendApplication.class, args);
    }
}
