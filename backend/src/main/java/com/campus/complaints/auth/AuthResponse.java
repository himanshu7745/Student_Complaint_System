package com.campus.complaints.auth;

import java.time.OffsetDateTime;

public record AuthResponse(
        String accessToken,
        String tokenType,
        OffsetDateTime expiresAt,
        UserProfile user
) {
    public record UserProfile(Long id, String name, String email, String role, String department) {}
}
