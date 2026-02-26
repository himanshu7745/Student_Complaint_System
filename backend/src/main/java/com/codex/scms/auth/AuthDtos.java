package com.codex.scms.auth;

import com.codex.scms.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class AuthDtos {
    private AuthDtos() {}

    public record SignupRequest(
        @NotBlank @Size(max = 150) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotNull UserRole role
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record AuthUserResponse(UUID id, String name, String email, UserRole role, Instant createdAt) {}

    public record AuthResponse(String accessToken, AuthUserResponse user) {}
}
