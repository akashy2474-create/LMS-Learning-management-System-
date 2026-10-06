package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.Message;
import com.lms.service.MessageService;
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

@WebServlet("/api/messages/*")
public class MessageServlet extends HttpServlet {
    private final MessageService messageService = new MessageService();
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

        int userId = (Integer) session.getAttribute("userId");
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            List<Message> messages = messageService.getUserMessages(userId);
            jsonResponse.put("success", true);
            jsonResponse.put("messages", messages);

            long unreadCount = messages.stream().filter(m -> m.getReceiverId() == userId && !m.isRead()).count();
            jsonResponse.put("unreadCount", unreadCount);

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

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        int senderId = (Integer) session.getAttribute("userId");
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
            int receiverId = Integer.parseInt(requestData.get("receiverId").toString());
            int courseId = Integer.parseInt(requestData.get("courseId").toString());
            String messageText = (String) requestData.get("message");

            Message sentMsg = messageService.sendMessage(senderId, receiverId, courseId, messageText);

            response.setStatus(HttpServletResponse.SC_CREATED);
            jsonResponse.put("success", true);
            jsonResponse.put("message", "Message sent successfully.");
            jsonResponse.put("data", sentMsg);

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

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        int userId = (Integer) session.getAttribute("userId");
        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if (pathInfo != null && (pathInfo.contains("/read-all") || pathInfo.contains("/readAll"))) {
                boolean marked = messageService.markAllRead(userId);
                jsonResponse.put("success", marked);
                jsonResponse.put("message", "All messages marked as read.");
            } else if (pathInfo != null && pathInfo.contains("/read")) {
                int messageId = 0;
                String[] parts = pathInfo.split("/");
                for (String part : parts) {
                    if (part.matches("\\d+")) {
                        messageId = Integer.parseInt(part);
                        break;
                    }
                }
                if (messageId == 0) {
                    try {
                        Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
                        if (requestData != null && requestData.get("messageId") != null) {
                            messageId = Integer.parseInt(requestData.get("messageId").toString());
                        }
                    } catch (Exception ignored) {}
                }

                boolean marked = messageService.markRead(messageId, userId);
                jsonResponse.put("success", marked);
                jsonResponse.put("message", "Message marked as read.");
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

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("message", message);
        response.getWriter().write(objectMapper.writeValueAsString(errorMap));
    }
}
