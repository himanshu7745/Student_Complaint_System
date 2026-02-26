package com.codex.scms.department;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public final class DepartmentDtos {
    private DepartmentDtos() {}

    public record DepartmentRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email String authorityEmail
    ) {}

    public record DepartmentResponse(
        UUID id,
        String name,
        String authorityEmail,
        Instant createdAt,
        Instant updatedAt
    ) {}
}
