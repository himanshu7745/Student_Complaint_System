package com.codex.scms.security;

import com.codex.scms.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties appProperties;
    private SecretKey signingKey;

    @PostConstruct
    void init() {
        this.signingKey = Keys.hmacShaKeyFor(appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getJwt().getAccessTokenExpirationMinutes(), ChronoUnit.MINUTES);
        return Jwts.builder()
            .subject(user.getEmail())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .claims(Map.of(
                "uid", user.getId().toString(),
                "role", user.getRole().name(),
                "name", user.getName()
            ))
            .signWith(signingKey)
            .compact();
    }

    public String generateAcknowledgementToken(UUID complaintId) {
        Instant now = Instant.now();
        Instant expiry = now.plus(appProperties.getJwt().getAckTokenExpirationHours(), ChronoUnit.HOURS);
        return Jwts.builder()
            .subject(complaintId.toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(expiry))
            .claim("type", "complaint_ack")
            .signWith(signingKey)
            .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
    }

    public boolean isAccessTokenValid(String token, AuthenticatedUser user) {
        Claims claims = parseToken(token);
        return user.getEmail().equalsIgnoreCase(claims.getSubject())
            && claims.getExpiration().after(new Date());
    }

    public UUID getUserId(String token) {
        Claims claims = parseToken(token);
        return UUID.fromString(String.valueOf(claims.get("uid")));
    }

    public boolean isAcknowledgementTokenForComplaint(String token, UUID complaintId) {
        Claims claims = parseToken(token);
        return "complaint_ack".equals(claims.get("type")) && complaintId.toString().equals(claims.getSubject());
    }
}
