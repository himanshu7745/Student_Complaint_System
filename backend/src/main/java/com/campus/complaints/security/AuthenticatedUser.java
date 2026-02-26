package com.campus.complaints.security;

import com.campus.complaints.domain.user.RoleType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthenticatedUser {
    private Long id;
    private String email;
    private String name;
    private RoleType role;
    private String department;
    private boolean active;
}
