package com.lms.dao;

import com.lms.model.Settings;
import com.lms.util.DBConnection;

import java.sql.*;

public class SettingsDAO {

    public Settings getSettings() throws SQLException {
        String sql = "SELECT * FROM settings WHERE id = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            if (rs.next()) {
                Settings s = new Settings();
                s.setId(rs.getInt("id"));
                s.setPlatformName(rs.getString("platform_name"));
                s.setPlatformEmail(rs.getString("platform_email"));
                s.setAllowStudentRegistration(rs.getBoolean("allow_student_registration"));
                s.setAllowInstructorRegistration(rs.getBoolean("allow_instructor_registration"));
                s.setUpdatedAt(rs.getTimestamp("updated_at"));
                return s;
            }
        }
        // Fallback default if empty table
        return new Settings(1, "Online Learning Management System", "admin@lms.com", true, true, new Timestamp(System.currentTimeMillis()));
    }

    public boolean updateSettings(Settings settings) throws SQLException {
        String sql = "UPDATE settings SET platform_name = ?, platform_email = ?, allow_student_registration = ?, allow_instructor_registration = ? WHERE id = 1";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, settings.getPlatformName());
            stmt.setString(2, settings.getPlatformEmail());
            stmt.setBoolean(3, settings.isAllowStudentRegistration());
            stmt.setBoolean(4, settings.isAllowInstructorRegistration());

            int rows = stmt.executeUpdate();
            if (rows == 0) {
                // Insert if row 1 doesn't exist
                String insertSql = "INSERT INTO settings (id, platform_name, platform_email, allow_student_registration, allow_instructor_registration) VALUES (1, ?, ?, ?, ?)";
                try (PreparedStatement insertStmt = conn.prepareStatement(insertSql)) {
                    insertStmt.setString(1, settings.getPlatformName());
                    insertStmt.setString(2, settings.getPlatformEmail());
                    insertStmt.setBoolean(3, settings.isAllowStudentRegistration());
                    insertStmt.setBoolean(4, settings.isAllowInstructorRegistration());
                    return insertStmt.executeUpdate() > 0;
                }
            }
            return true;
        }
    }
}
