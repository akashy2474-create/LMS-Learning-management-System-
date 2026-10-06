package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.User;
import com.lms.service.AnalyticsService;
import com.lms.service.CourseService;
import com.lms.service.SettingsService;
import com.lms.service.UserService;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/api/admin/*")
public class AdminServlet extends HttpServlet {
    private final UserService userService = new UserService();
    private final CourseService courseService = new CourseService();
    private final SettingsService settingsService = new SettingsService();
    private final AnalyticsService analyticsService = new AnalyticsService();
    private final com.lms.service.EnrollmentService enrollmentService = new com.lms.service.EnrollmentService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if (!verifyAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if ("/users".equals(pathInfo)) {
                List<User> users = userService.getAllUsers();
                jsonResponse.put("success", true);
                jsonResponse.put("users", users);

            } else if ("/enrollments".equals(pathInfo)) {
                List<com.lms.model.Enrollment> enrollments = enrollmentService.getAllEnrollments();
                jsonResponse.put("success", true);
                jsonResponse.put("enrollments", enrollments);

            } else if ("/analytics".equals(pathInfo)) {
                Map<String, Integer> analytics = analyticsService.getSystemAnalytics();
                jsonResponse.put("success", true);
                jsonResponse.put("analytics", analytics);

            } else if ("/settings".equals(pathInfo)) {
                jsonResponse.put("success", true);
                jsonResponse.put("settings", settingsService.getSettings());

            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Endpoint not found.");
            }

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));

        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if (!verifyAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);

            if ("/users".equals(pathInfo)) {
                String name = (String) requestData.get("name");
                String email = (String) requestData.get("email");
                String password = (String) requestData.get("password");
                String role = (String) requestData.get("role");

                User newUser = userService.adminCreateUser(name, email, password, role);

                response.setStatus(HttpServletResponse.SC_CREATED);
                jsonResponse.put("success", true);
                jsonResponse.put("message", "User created successfully.");
                jsonResponse.put("user", newUser);

            } else if (pathInfo != null && pathInfo.contains("/enrollments/") && pathInfo.contains("/approve")) {
                String[] parts = pathInfo.split("/");
                int enrollmentId = Integer.parseInt(parts[2]);
                HttpSession session = request.getSession(false);
                int adminUserId = session != null && session.getAttribute("userId") != null ? (Integer) session.getAttribute("userId") : 1;
                boolean approved = enrollmentService.approveEnrollment(enrollmentId, adminUserId);

                if (approved) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Enrollment approved successfully.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Enrollment approval failed.");
                    return;
                }

            } else if (pathInfo != null && pathInfo.contains("/enrollments/") && pathInfo.contains("/reject")) {
                String[] parts = pathInfo.split("/");
                int enrollmentId = Integer.parseInt(parts[2]);
                HttpSession session = request.getSession(false);
                int adminUserId = session != null && session.getAttribute("userId") != null ? (Integer) session.getAttribute("userId") : 1;
                String reason = requestData != null && requestData.get("reason") != null ? (String) requestData.get("reason") : "Enrollment requirements not satisfied";
                boolean rejected = enrollmentService.rejectEnrollment(enrollmentId, reason, adminUserId);

                if (rejected) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Enrollment rejected.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Enrollment rejection failed.");
                    return;
                }

            } else if (pathInfo != null && (pathInfo.contains("/courses/") || pathInfo.contains("/")) && pathInfo.endsWith("/approve")) {
                int courseId = 0;
                String[] parts = pathInfo.split("/");
                for (String part : parts) {
                    if (part.matches("\\d+")) {
                        courseId = Integer.parseInt(part);
                        break;
                    }
                }
                boolean approved = courseService.approveCourse(courseId);

                if (approved) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Course approved successfully.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Course approval failed.");
                    return;
                }

            } else if (pathInfo != null && (pathInfo.contains("/courses/") || pathInfo.contains("/")) && pathInfo.endsWith("/reject")) {
                int courseId = 0;
                String[] parts = pathInfo.split("/");
                for (String part : parts) {
                    if (part.matches("\\d+")) {
                        courseId = Integer.parseInt(part);
                        break;
                    }
                }
                String reason = requestData != null && requestData.get("reason") != null ? (String) requestData.get("reason") : "Course does not meet review guidelines";
                boolean rejected = courseService.rejectCourse(courseId, reason);

                if (rejected) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Course rejected.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Course rejection failed.");
                    return;
                }

            } else {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found.");
                return;
            }

            response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));

        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if (!verifyAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);

            if ("/users".equals(pathInfo) || (pathInfo != null && pathInfo.startsWith("/users/"))) {
                int userId = 0;
                if (requestData.get("id") instanceof Number) {
                    userId = ((Number) requestData.get("id")).intValue();
                } else if (requestData.get("id") != null) {
                    userId = Integer.parseInt(requestData.get("id").toString());
                } else if (pathInfo != null && pathInfo.length() > "/users/".length()) {
                    userId = Integer.parseInt(pathInfo.substring("/users/".length()));
                }
                String name = (String) requestData.get("name");
                String email = (String) requestData.get("email");
                String role = (String) requestData.get("role");

                boolean updated = userService.updateProfile(userId, name, email, role);
                if (updated) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "User updated successfully.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Failed to update user.");
                    return;
                }

            } else if ("/settings".equals(pathInfo)) {
                String platformName = (String) requestData.get("platformName");
                String platformEmail = (String) requestData.get("platformEmail");
                boolean allowStudentReg = (Boolean) requestData.get("allowStudentRegistration");
                boolean allowInstructorReg = (Boolean) requestData.get("allowInstructorRegistration");

                boolean updated = settingsService.updateSettings(platformName, platformEmail, allowStudentReg, allowInstructorReg);
                if (updated) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Settings updated successfully.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Failed to update settings.");
                    return;
                }

            } else {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found.");
                return;
            }

            response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));

        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        if (!verifyAdmin(request, response)) return;

        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if (pathInfo != null && pathInfo.startsWith("/users/")) {
                int targetUserId = Integer.parseInt(pathInfo.substring("/users/".length()));
                boolean deleted = userService.deleteUser(targetUserId);

                if (deleted) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "User deleted successfully.");
                } else {
                    sendError(response, HttpServletResponse.SC_BAD_REQUEST, "User not found or deletion failed.");
                    return;
                }
            } else {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found.");
                return;
            }

            response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));

        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    private boolean verifyAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return false;
        }
        String role = (String) session.getAttribute("role");
        if (!"ADMIN".equals(role)) {
            sendError(response, HttpServletResponse.SC_FORBIDDEN, "Forbidden: Admin authorization required.");
            return false;
        }
        return true;
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("message", message);
        response.getWriter().write(objectMapper.writeValueAsString(errorMap));
    }
}
