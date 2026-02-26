package com.campus.complaints.auth;

import com.campus.complaints.common.exception.BadRequestException;
import com.campus.complaints.config.AppProperties;
import com.campus.complaints.domain.user.UserEntity;
import com.campus.complaints.domain.user.UserRepository;
import com.campus.complaints.security.JwtService;
import com.campus.complaints.security.SecurityUtils;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AppProperties appProperties;

    public AuthResponse login(AuthController.LoginRequest request) {
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email())
                .filter(UserEntity::isActive)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        OffsetDateTime expiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(appProperties.getJwt().getAccessTokenMinutes());
        return new AuthResponse(token, "Bearer", expiresAt, profileOf(user));
    }

    public AuthResponse.UserProfile currentProfile() {
        Long userId = SecurityUtils.currentUser().getId();
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));
        return profileOf(user);
    }

    private AuthResponse.UserProfile profileOf(UserEntity user) {
        return new AuthResponse.UserProfile(user.getId(), user.getName(), user.getEmail(), user.getRole().name(), user.getDepartment().name());
    }
}
