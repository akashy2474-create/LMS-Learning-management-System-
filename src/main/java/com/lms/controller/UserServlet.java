package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.User;
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

@WebServlet("/api/user/*")
public class UserServlet extends HttpServlet {
    private final UserService userService = new UserService();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if ("/profile".equals(pathInfo) || pathInfo == null || "/".equals(pathInfo)) {
                int userId = (Integer) session.getAttribute("userId");
                User user = userService.getUserById(userId);

                if (user == null) {
                    sendError(response, HttpServletResponse.SC_NOT_FOUND, "User profile not found.");
                    return;
                }

                jsonResponse.put("success", true);
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", user.getId());
                userMap.put("name", user.getName());
                userMap.put("email", user.getEmail());
                userMap.put("role", user.getRole());
                userMap.put("createdAt", user.getCreatedAt());
                jsonResponse.put("user", userMap);

            } else if ("/all".equals(pathInfo)) {
                String role = (String) session.getAttribute("role");
                if (!"ADMIN".equals(role)) {
                    sendError(response, HttpServletResponse.SC_FORBIDDEN, "Access denied. Admin authorization required.");
                    return;
                }

                List<User> users = userService.getAllUsers();
                jsonResponse.put("success", true);
                jsonResponse.put("users", users);

            } else {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found.");
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));

        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        int userId = (Integer) session.getAttribute("userId");
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
            String name = (String) requestData.get("name");
            String email = (String) requestData.get("email");

            boolean updated = userService.updateProfile(userId, name, email);

            if (updated) {
                session.setAttribute("name", name);
                session.setAttribute("email", email);

                jsonResponse.put("success", true);
                jsonResponse.put("message", "Profile updated successfully.");
                
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", userId);
                userMap.put("name", name);
                userMap.put("email", email);
                userMap.put("role", session.getAttribute("role"));
                jsonResponse.put("user", userMap);

                response.setStatus(HttpServletResponse.SC_OK);
            } else {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Failed to update profile.");
                return;
            }

        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
            return;
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error updating profile: " + e.getMessage());
            return;
        }

        response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("message", message);
        response.getWriter().write(objectMapper.writeValueAsString(errorMap));
    }
}
