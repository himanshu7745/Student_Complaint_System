package com.campus.complaints.domain.prediction;

import java.util.List;

public record PredictionResult(
        boolean success,
        String modelVersion,
        Double overallConfidence,
        Double severityScore,
        List<PredictedLabel> labels,
        String rawJson,
        String failureReason
) {
    public record PredictedLabel(String label, Double confidence) {}

    public static PredictionResult failure(String reason, String rawJson) {
        return new PredictionResult(false, null, null, null, List.of(), rawJson, reason);
    }
}
