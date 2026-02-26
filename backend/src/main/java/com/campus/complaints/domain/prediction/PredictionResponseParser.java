package com.campus.complaints.domain.prediction;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class PredictionResponseParser {

    public PredictionResult parse(JsonNode root, String rawJson) {
        JsonNode payload = root;
        if (root.isArray() && root.size() > 0) {
            payload = root.get(0);
        } else if (root.has("data") && root.get("data").isArray() && root.get("data").size() > 0) {
            payload = root.get("data").get(0);
        }

        String modelVersion = text(payload, "modelVersion", "model_version", "version");
        Double overall = number(payload, "overallConfidence", "overall_confidence", "confidence");
        Double severity = number(payload, "severityScore", "severity_score", "severity");

        List<PredictionResult.PredictedLabel> labels = parseLabels(payload);
        if ((overall == null || overall == 0d) && !labels.isEmpty()) {
            overall = labels.stream().map(PredictionResult.PredictedLabel::confidence).filter(java.util.Objects::nonNull)
                    .reduce(0d, Double::sum) / labels.size();
        }

        return new PredictionResult(true, modelVersion, normalizeConfidence(overall), severity, labels, rawJson, null);
    }

    private List<PredictionResult.PredictedLabel> parseLabels(JsonNode payload) {
        List<PredictionResult.PredictedLabel> labels = new ArrayList<>();
        JsonNode labelsNode = firstNode(payload, "labels", "categories", "predictions", "departments");

        if (labelsNode == null || labelsNode.isNull()) return labels;

        if (labelsNode.isArray()) {
            for (JsonNode item : labelsNode) {
                if (item.isTextual()) {
                    labels.add(new PredictionResult.PredictedLabel(item.asText().toUpperCase(), null));
                } else if (item.isObject()) {
                    String label = text(item, "label", "category", "department", "name");
                    Double score = number(item, "confidence", "score", "probability");
                    if (label != null) labels.add(new PredictionResult.PredictedLabel(label.toUpperCase().replace(' ', '_'), normalizeConfidence(score)));
                }
            }
            return labels;
        }

        if (labelsNode.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> iterator = labelsNode.fields();
            while (iterator.hasNext()) {
                Map.Entry<String, JsonNode> e = iterator.next();
                Double score = e.getValue().isNumber() ? e.getValue().asDouble() : number(e.getValue(), "confidence", "score");
                labels.add(new PredictionResult.PredictedLabel(e.getKey().toUpperCase().replace(' ', '_'), normalizeConfidence(score)));
            }
        }
        return labels;
    }

    private JsonNode firstNode(JsonNode node, String... keys) {
        for (String key : keys) if (node.has(key)) return node.get(key);
        return null;
    }

    private String text(JsonNode node, String... keys) {
        for (String key : keys) {
            if (node.has(key) && node.get(key).isValueNode()) return node.get(key).asText();
        }
        return null;
    }

    private Double number(JsonNode node, String... keys) {
        for (String key : keys) {
            if (node.has(key) && node.get(key).isNumber()) return node.get(key).asDouble();
            if (node.has(key) && node.get(key).isTextual()) {
                try { return Double.parseDouble(node.get(key).asText()); } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    private Double normalizeConfidence(Double v) {
        if (v == null) return null;
        return v > 1.0 ? Math.min(1.0, v / 100.0) : Math.max(0.0, v);
    }
}
