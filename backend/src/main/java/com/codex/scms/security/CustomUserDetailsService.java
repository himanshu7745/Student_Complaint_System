package com.codex.scms.security;

import com.codex.scms.common.AppException;
import com.codex.scms.domain.entity.User;
import com.codex.scms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByEmailIgnoreCase(username)
            .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        return new AuthenticatedUser(user.getId(), user.getName(), user.getEmail(), user.getPasswordHash(), user.getRole());
    }
}
