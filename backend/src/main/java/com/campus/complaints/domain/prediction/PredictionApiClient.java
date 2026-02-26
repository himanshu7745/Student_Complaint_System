package com.campus.complaints.domain.prediction;

import com.campus.complaints.common.exception.IntegrationException;
import com.campus.complaints.config.PredictionProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PredictionApiClient {

    private final PredictionProperties properties;
    private final ObjectMapper objectMapper;
    private final PredictionResponseParser parser;

    public PredictionResult predictSingle(PredictionRequestItem item) {
        try {
            // Wrap inside "items"
            PredictionRequest requestPayload = new PredictionRequest(List.of(item));
            String requestBody = objectMapper.writeValueAsString(requestPayload);

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()))
                    .build();

            HttpRequest request = HttpRequest.newBuilder(
                            URI.create(properties.getEndpoint().toString()))
                    .timeout(Duration.ofMillis(properties.getReadTimeoutMs()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                throw new IntegrationException(
                        "Prediction API returned status " + response.statusCode());
            }

            String rawJson = response.body();
            JsonNode root = objectMapper.readTree(rawJson);
            return parser.parse(root, rawJson);

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.warn("Prediction API call interrupted: {}", ex.getMessage());
            throw new IntegrationException("Prediction API call interrupted", ex);

        } catch (IOException ex) {
            log.warn("Prediction API call failed: {}", ex.getMessage());
            throw new IntegrationException("Prediction API call failed", ex);

        } catch (IntegrationException ex) {
            throw ex;

        } catch (Exception ex) {
            throw new IntegrationException("Unable to parse prediction response", ex);
        }
    }

    public record PredictionRequestItem(String title, String description, List<String> images) {}
    public record PredictionRequest(List<PredictionRequestItem> items) {}
}
