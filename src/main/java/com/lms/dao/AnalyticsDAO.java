package com.lms.dao;

import com.lms.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

public class AnalyticsDAO {

    public Map<String, Integer> getSystemAnalytics() throws SQLException {
        Map<String, Integer> analytics = new HashMap<>();

        String userSql = "SELECT role, COUNT(*) as count FROM users GROUP BY role";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(userSql);
             ResultSet rs = stmt.executeQuery()) {
            
            int total = 0;
            while (rs.next()) {
                String role = rs.getString("role");
                int count = rs.getInt("count");
                total += count;
                if ("STUDENT".equals(role)) analytics.put("totalStudents", count);
                else if ("INSTRUCTOR".equals(role)) analytics.put("totalInstructors", count);
                else if ("ADMIN".equals(role)) analytics.put("totalAdmins", count);
            }
            analytics.put("totalUsers", total);
        }

        String courseSql = "SELECT status, COUNT(*) as count FROM courses GROUP BY status";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(courseSql);
             ResultSet rs = stmt.executeQuery()) {
            
            int totalCourses = 0;
            while (rs.next()) {
                String status = rs.getString("status");
                int count = rs.getInt("count");
                totalCourses += count;
                if ("PENDING".equals(status)) analytics.put("pendingCourses", count);
                else if ("APPROVED".equals(status)) analytics.put("approvedCourses", count);
                else if ("REJECTED".equals(status)) analytics.put("rejectedCourses", count);
            }
            analytics.put("totalCourses", totalCourses);
        }

        String enrollSql = "SELECT COUNT(*) FROM enrollments";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(enrollSql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                analytics.put("totalEnrollments", rs.getInt(1));
            }
        }

        // Fill defaults for zero keys
        analytics.putIfAbsent("totalUsers", 0);
        analytics.putIfAbsent("totalStudents", 0);
        analytics.putIfAbsent("totalInstructors", 0);
        analytics.putIfAbsent("totalAdmins", 0);
        analytics.putIfAbsent("totalCourses", 0);
        analytics.putIfAbsent("pendingCourses", 0);
        analytics.putIfAbsent("approvedCourses", 0);
        analytics.putIfAbsent("rejectedCourses", 0);
        analytics.putIfAbsent("totalEnrollments", 0);

        return analytics;
    }
}
