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
import java.util.Map;

@WebServlet(urlPatterns = {"/api/profile", "/api/user/profile"})
public class ProfileServlet extends HttpServlet {
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

        try {
            int userId = (Integer) session.getAttribute("userId");
            User user = userService.getUserById(userId);
            if (user != null) {
                user.setPassword(null);
                Map<String, Object> jsonResponse = new HashMap<>();
                jsonResponse.put("success", true);
                jsonResponse.put("user", user);
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));
            } else {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "User profile not found.");
            }
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

        try {
            int userId = (Integer) session.getAttribute("userId");
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
            String name = (String) requestData.get("name");
            String email = (String) requestData.get("email");

            String role = (String) session.getAttribute("role");
            boolean updated = userService.updateProfile(userId, name, email, role);

            if (updated) {
                User updatedUser = userService.getUserById(userId);
                if (updatedUser != null) {
                    updatedUser.setPassword(null);
                    // Update session attributes
                    session.setAttribute("name", updatedUser.getName());
                    session.setAttribute("email", updatedUser.getEmail());
                }

                Map<String, Object> jsonResponse = new HashMap<>();
                jsonResponse.put("success", true);
                jsonResponse.put("message", "Profile updated successfully.");
                jsonResponse.put("user", updatedUser);
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(objectMapper.writeValueAsString(jsonResponse));
            } else {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Failed to update profile.");
            }
        } catch (IllegalArgumentException e) {
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Server error: " + e.getMessage());
        }
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("message", message);
        response.getWriter().write(objectMapper.writeValueAsString(errorMap));
    }
}
