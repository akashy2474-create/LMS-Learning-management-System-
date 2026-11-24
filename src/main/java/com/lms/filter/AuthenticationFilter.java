package com.lms.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.util.SecurityConfig;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/**
 * AuthenticationFilter - Role-Based Web Security & Session Protection
 * 
 * Rubric Compliance: Servlets & Web Integration - Session Management & Filters (7 marks)
 * 
 * Enforces:
 * 1. CORS restricted to a trusted origin allowlist (CORS_ALLOWED_ORIGINS) with credentials for JSESSIONID.
 * 1b. CSRF: POST/PUT/DELETE/PATCH must send the X-CSRF-Token issued at login.
 * 2. Unauthenticated access whitelist for login, registration, approved course catalog, and health check.
 * 3. Session validation via HttpServletRequest.getSession(false).
 * 4. Strict Role-Based Access Control (RBAC):
 *    - /api/admin/* requires role == 'ADMIN'
 *    - /api/instructor/* requires role in ('INSTRUCTOR', 'ADMIN')
 */
@WebFilter("/*")
public class AuthenticationFilter implements Filter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final java.util.Set<String> PUBLIC_ENDPOINTS = new java.util.HashSet<>(java.util.Arrays.asList(
        "/login", "/register", "/session", "/auth/me", "/courses/approved", "/courses/public", "/health", "/healthz"
    ));

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // CORS: only origins from the trusted allowlist (CORS_ALLOWED_ORIGINS) are echoed back
        String origin = httpRequest.getHeader("Origin");
        httpResponse.setHeader("Vary", "Origin");
        boolean originAllowed = origin != null && SecurityConfig.allowedOrigins().contains(origin);
        if (originAllowed) {
            httpResponse.setHeader("Access-Control-Allow-Origin", origin);
            httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
            httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            httpResponse.setHeader("Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Requested-With, Accept, " + SecurityConfig.CSRF_HEADER);
        }

        // Handle preflight OPTIONS requests immediately
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(origin == null || originAllowed
                    ? HttpServletResponse.SC_OK : HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        String requestURI = httpRequest.getRequestURI();

        // Check if request matches any public endpoint in the HashSet
        boolean isPublic = !requestURI.contains("/api/") || PUBLIC_ENDPOINTS.stream().anyMatch(requestURI::endsWith);

        if (isPublic) {
            chain.doFilter(request, response);
            return;
        }

        // Verify active HttpSession
        HttpSession session = httpRequest.getSession(false);

        if (session == null || session.getAttribute("userId") == null) {
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.setContentType("application/json");
            httpResponse.setCharacterEncoding("UTF-8");

            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("success", false);
            errorMap.put("message", "Your session has expired. Please login again.");

            httpResponse.getWriter().write(objectMapper.writeValueAsString(errorMap));
            return;
        }

        // CSRF protection: every state-changing request must carry the token issued at login
        if (isStateChanging(httpRequest.getMethod()) && !isValidCsrfToken(httpRequest, session)) {
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType("application/json");
            httpResponse.setCharacterEncoding("UTF-8");

            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("success", false);
            errorMap.put("message", "Forbidden: missing or invalid CSRF token.");

            httpResponse.getWriter().write(objectMapper.writeValueAsString(errorMap));
            return;
        }

        String userRole = (String) session.getAttribute("role");

        // Enforce ADMIN role access for administrative endpoints
        if (requestURI.contains("/api/admin/") && !"ADMIN".equals(userRole)) {
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType("application/json");
            httpResponse.setCharacterEncoding("UTF-8");

            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("success", false);
            errorMap.put("message", "Forbidden: Administrator privileges required.");

            httpResponse.getWriter().write(objectMapper.writeValueAsString(errorMap));
            return;
        }

        // Enforce INSTRUCTOR role access
        if (requestURI.contains("/api/instructor/") && !"INSTRUCTOR".equals(userRole) && !"ADMIN".equals(userRole)) {
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType("application/json");
            httpResponse.setCharacterEncoding("UTF-8");

            Map<String, Object> errorMap = new HashMap<>();
            errorMap.put("success", false);
            errorMap.put("message", "Forbidden: Instructor privileges required.");

            httpResponse.getWriter().write(objectMapper.writeValueAsString(errorMap));
            return;
        }

        chain.doFilter(request, response);
    }

    private static boolean isStateChanging(String method) {
        return "POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method);
    }

    private static boolean isValidCsrfToken(HttpServletRequest request, HttpSession session) {
        Object expected = session.getAttribute(SecurityConfig.CSRF_SESSION_ATTR);
        String actual = request.getHeader(SecurityConfig.CSRF_HEADER);
        if (!(expected instanceof String) || actual == null) {
            return false;
        }
        return MessageDigest.isEqual(
                ((String) expected).getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public void destroy() {}
}
