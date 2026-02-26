package com.codex.scms.auth;

import com.codex.scms.common.ApiResponse;
import com.codex.scms.common.AppException;
import com.codex.scms.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    @Operation(summary = "Signup as student/admin")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> signup(@Valid @RequestBody AuthDtos.SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Signup successful", authService.signup(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT")
    public ApiResponse<AuthDtos.AuthResponse> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return ApiResponse.ok("Login successful", authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user")
    public ApiResponse<AuthDtos.AuthUserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return ApiResponse.ok(authService.me(user));
    }
}
