package com.codex.scms.auth;

import com.codex.scms.common.AppException;
import com.codex.scms.domain.entity.User;
import com.codex.scms.repository.UserRepository;
import com.codex.scms.security.AuthenticatedUser;
import com.codex.scms.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthDtos.AuthResponse signup(AuthDtos.SignupRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new AppException(HttpStatus.CONFLICT, "Email already in use");
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user = userRepository.save(user);

        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), user.getName(), user.getEmail(), user.getPasswordHash(), user.getRole());
        return new AuthDtos.AuthResponse(jwtService.generateAccessToken(principal), toUserResponse(user));
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
        );
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "User not found"));
        return new AuthDtos.AuthResponse(jwtService.generateAccessToken(principal), toUserResponse(user));
    }

    public AuthDtos.AuthUserResponse me(AuthenticatedUser user) {
        User entity = userRepository.findById(user.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        return toUserResponse(entity);
    }

    private AuthDtos.AuthUserResponse toUserResponse(User user) {
        return new AuthDtos.AuthUserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt());
    }
}
