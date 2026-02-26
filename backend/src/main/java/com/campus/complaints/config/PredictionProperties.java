package com.campus.complaints.config;

import java.net.URI;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "prediction")
public class PredictionProperties {
    public enum ImageInputMode { URL, BASE64 }

    private URI endpoint;
    private ImageInputMode imageInputMode = ImageInputMode.URL;
    private int connectTimeoutMs = 3000;
    private int readTimeoutMs = 10000;
    private boolean rerunOnUpdate = true;
    private int maxBase64Bytes = 2 * 1024 * 1024;
}
