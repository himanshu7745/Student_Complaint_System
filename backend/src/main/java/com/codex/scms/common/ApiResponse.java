package com.codex.scms.common;

import java.time.Instant;

public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp) {

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, Instant.now());
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok("Request successful", data);
    }

    public static ApiResponse<Object> error(String message) {
        return new ApiResponse<>(false, message, null, Instant.now());
    }
}
