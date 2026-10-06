package com.lms.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * DBConnection - Database Connection Utility for MySQL 8.0
 * 
 * Supports environment variables and common local developer credentials:
 * - DB_URL (Default: jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC)
 * - DB_USER (Default: root)
 * - DB_PASSWORD (Default: root / password / empty)
 */
public class DBConnection {
    private static final String URL = System.getenv("DB_URL") != null ? 
            System.getenv("DB_URL") : "jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = System.getenv("DB_USER") != null ? System.getenv("DB_USER") : "root";
    private static final String PASSWORD = System.getenv("DB_PASSWORD") != null ? System.getenv("DB_PASSWORD") : "root";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL JDBC Driver not found: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        try {
            return DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (SQLException e) {
            // Fallback trial with "password" if "root" failed and not explicitly configured
            if (System.getenv("DB_PASSWORD") == null) {
                try {
                    return DriverManager.getConnection(URL, USER, "password");
                } catch (SQLException ignored) {
                    try {
                        return DriverManager.getConnection(URL, USER, "");
                    } catch (SQLException ignored2) {}
                }
            }
            throw e;
        }
    }
}
