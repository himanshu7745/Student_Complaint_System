package com.campus.complaints.domain.prediction;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
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
        if (severity == null) {
            severity = severityFromText(payload);
        }

        List<PredictionResult.PredictedLabel> labels = parseLabels(payload);
        if ((overall == null || overall == 0d) && !labels.isEmpty()) {
            overall = labels.stream().map(PredictionResult.PredictedLabel::confidence).filter(java.util.Objects::nonNull)
                    .reduce(0d, Double::sum) / labels.size();
        }
        if (overall == null || overall == 0d) {
            overall = classifierTopProbability(payload);
        }

        return new PredictionResult(true, modelVersion, normalizeConfidence(overall), severity, labels, rawJson, null);
    }

    private List<PredictionResult.PredictedLabel> parseLabels(JsonNode payload) {
        List<PredictionResult.PredictedLabel> labels = new ArrayList<>();
        JsonNode labelsNode = firstNode(payload, "labels", "categories", "predictions", "departments");

        if (labelsNode == null || labelsNode.isNull()) {
            return parseClassifierStyleLabels(payload);
        }

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

    private List<PredictionResult.PredictedLabel> parseClassifierStyleLabels(JsonNode payload) {
        List<PredictionResult.PredictedLabel> labels = new ArrayList<>();
        JsonNode predLabel = payload.get("pred_label");
        if (predLabel == null || predLabel.isNull()) return labels;

        JsonNode probs = payload.get("probs");
        JsonNode predIdx = payload.get("pred_idx");

        if (predLabel.isArray()) {
            for (int i = 0; i < predLabel.size(); i++) {
                JsonNode item = predLabel.get(i);
                if (!item.isValueNode()) continue;
                String label = item.asText();
                Double score = probabilityAt(probs, i);
                labels.add(new PredictionResult.PredictedLabel(normalizeLabel(label), normalizeConfidence(score)));
            }
            return labels;
        }

        if (predLabel.isValueNode()) {
            Integer idx = predIdx != null && predIdx.isInt() ? predIdx.asInt() : null;
            Double score = idx != null ? probabilityAt(probs, idx) : classifierTopProbability(payload);
            labels.add(new PredictionResult.PredictedLabel(normalizeLabel(predLabel.asText()), normalizeConfidence(score)));
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

    private String normalizeLabel(String label) {
        if (label == null) return null;
        return label.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
    }

    private Double classifierTopProbability(JsonNode payload) {
        JsonNode probs = payload.get("probs");
        if (probs == null || !probs.isArray() || probs.isEmpty()) return null;
        Double top = null;
        for (JsonNode p : probs) {
            Double value = p.isNumber() ? p.asDouble() : (p.isTextual() ? parseDoubleOrNull(p.asText()) : null);
            if (value == null) continue;
            top = top == null ? value : Math.max(top, value);
        }
        return top;
    }

    private Double probabilityAt(JsonNode probs, int index) {
        if (probs == null || !probs.isArray() || index < 0 || index >= probs.size()) return null;
        JsonNode p = probs.get(index);
        if (p == null || p.isNull()) return null;
        if (p.isNumber()) return p.asDouble();
        if (p.isTextual()) return parseDoubleOrNull(p.asText());
        return null;
    }

    private Double severityFromText(JsonNode payload) {
        String severityText = text(payload, "severity", "priority");
        if (severityText == null) return null;
        return switch (severityText.trim().toUpperCase(Locale.ROOT)) {
            case "CRITICAL" -> 0.95;
            case "HIGH" -> 0.75;
            case "MEDIUM" -> 0.50;
            case "LOW" -> 0.20;
            default -> null;
        };
    }

    private Double parseDoubleOrNull(String value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
