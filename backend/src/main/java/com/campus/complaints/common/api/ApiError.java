package com.campus.complaints.common.api;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiError(
        String code,
        String message,
        int status,
        String path,
        String correlationId,
        OffsetDateTime timestamp,
        List<FieldViolation> fieldViolations
) {
    public record FieldViolation(String field, String message) {}
}
