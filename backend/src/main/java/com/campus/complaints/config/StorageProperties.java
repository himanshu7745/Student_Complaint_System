package com.campus.complaints.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "storage")
public class StorageProperties {
    private String localRoot = "./data/attachments";
    private String publicBaseUrl = "http://localhost:8080/api/files";
    private String cdnBaseUrl;
    private boolean cdnImagesOnly = true;
}
