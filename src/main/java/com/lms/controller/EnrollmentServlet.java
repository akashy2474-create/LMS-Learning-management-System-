package com.lms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.model.Enrollment;
import com.lms.service.EnrollmentService;
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

@WebServlet("/api/enrollments/*")
public class EnrollmentServlet extends HttpServlet {
    private final EnrollmentService enrollmentService = new EnrollmentService();
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
        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if (pathInfo != null && pathInfo.startsWith("/course/")) {
                int courseId = Integer.parseInt(pathInfo.substring("/course/".length()));
                List<Enrollment> students = enrollmentService.getCourseStudents(courseId);
                jsonResponse.put("success", true);
                jsonResponse.put("students", students);

            } else {
                List<Enrollment> enrollments = enrollmentService.getStudentEnrollments(userId);
                jsonResponse.put("success", true);
                jsonResponse.put("enrollments", enrollments);
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

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        int studentId = (Integer) session.getAttribute("userId");
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            Map<?, ?> requestData = objectMapper.readValue(request.getInputStream(), Map.class);
            int courseId = Integer.parseInt(requestData.get("courseId").toString());

            boolean enrolled = enrollmentService.enrollStudent(studentId, courseId);

            if (enrolled) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                jsonResponse.put("success", true);
                jsonResponse.put("message", "Enrollment successful.");
            } else {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Enrollment failed.");
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

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userId") == null) {
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Your session has expired. Please login again.");
            return;
        }

        int studentId = (Integer) session.getAttribute("userId");
        String pathInfo = request.getPathInfo();
        Map<String, Object> jsonResponse = new HashMap<>();

        try {
            if (pathInfo != null && pathInfo.startsWith("/course/")) {
                int courseId = Integer.parseInt(pathInfo.substring("/course/".length()));
                boolean removed = enrollmentService.unenrollStudent(studentId, courseId);
                if (removed) {
                    jsonResponse.put("success", true);
                    jsonResponse.put("message", "Successfully unenrolled from course.");
                    response.setStatus(HttpServletResponse.SC_OK);
                } else {
                    sendError(response, HttpServletResponse.SC_NOT_FOUND, "Enrollment record not found.");
                    return;
                }
            } else {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Course ID required for unenrollment.");
                return;
            }

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
