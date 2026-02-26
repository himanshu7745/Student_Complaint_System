package com.campus.complaints.security;

import com.campus.complaints.config.AppProperties;
import com.campus.complaints.domain.user.UserEntity;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties appProperties;

    public String generateToken(UserEntity user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getJwt().getAccessTokenMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
                .issuer(appProperties.getJwt().getIssuer())
                .subject(user.getId().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .claims(Map.of(
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", user.getRole().name(),
                        "department", user.getDepartment().name()
                ))
                .signWith(signingKey())
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith((javax.crypto.SecretKey) signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Key signingKey() {
        String secret = appProperties.getJwt().getSecret();
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (Exception ignored) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(normalizeKey(keyBytes));
    }

    private byte[] normalizeKey(byte[] bytes) {
        if (bytes.length >= 32) return bytes;
        byte[] expanded = new byte[32];
        System.arraycopy(bytes, 0, expanded, 0, bytes.length);
        for (int i = bytes.length; i < 32; i++) {
            expanded[i] = (byte) (i * 31);
        }
        return expanded;
    }
}
