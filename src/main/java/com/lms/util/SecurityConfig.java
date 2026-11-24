package com.lms.util;

import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

/**
 * SecurityConfig - shared settings/helpers for CORS, CSRF and session security.
 *
 * Settings (JVM system property first, then environment variable):
 * - CORS_ALLOWED_ORIGINS  comma separated list (default: http://localhost:3000,http://localhost:5173)
 * - COOKIE_SECURE         "true" to mark the session cookie Secure (use this behind HTTPS in production)
 */
public final class SecurityConfig {
    public static final String CSRF_SESSION_ATTR = "csrfToken";
    public static final String CSRF_HEADER = "X-CSRF-Token";
    public static final int SESSION_TIMEOUT_SECONDS = 30 * 60;

    private static final String DEFAULT_ORIGINS = "http://localhost:3000,http://localhost:5173";
    private static final SecureRandom RANDOM = new SecureRandom();

    private SecurityConfig() {}

    public static Set<String> allowedOrigins() {
        String raw = DBConnection.setting("CORS_ALLOWED_ORIGINS");
        if (raw == null) raw = DEFAULT_ORIGINS;
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    public static boolean isCookieSecure() {
        return "true".equalsIgnoreCase(DBConnection.setting("COOKIE_SECURE"));
    }

    public static String newCsrfToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Starts a fresh authenticated session. Any existing session is invalidated first
     * (prevents session fixation) and a new CSRF token is generated for the new session.
     */
    public static HttpSession startSession(HttpServletRequest request) {
        HttpSession old = request.getSession(false);
        if (old != null) {
            old.invalidate();
        }
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(SESSION_TIMEOUT_SECONDS);
        session.setAttribute(CSRF_SESSION_ATTR, newCsrfToken());
        return session;
    }
}
