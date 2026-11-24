package com.lms.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import java.sql.Connection;
import java.sql.SQLException;

/**
 * DBConnection - HikariCP-backed connection pool for MySQL 8.0
 *
 * Configuration (JVM system property first, then environment variable):
 * - DB_URL            (default: jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC)
 * - DB_USER           (default: root)
 * - DB_PASSWORD       (REQUIRED - there is no default and no fallback guessing)
 * - DB_POOL_MAX_SIZE  (default: 10)
 * - DB_POOL_MIN_IDLE  (default: 2)
 *
 * The public API (getConnection()) is unchanged, so all DAOs keep working as before.
 * Closing a connection returns it to the pool instead of physically closing it.
 */
public class DBConnection {
    private static final String DEFAULT_URL =
            "jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";

    private static volatile HikariDataSource dataSource;

    private DBConnection() {}

    static String setting(String key) {
        String value = System.getProperty(key);
        if (value == null || value.isEmpty()) {
            value = System.getenv(key);
        }
        return (value == null || value.isEmpty()) ? null : value;
    }

    private static int intSetting(String key, int defaultValue) {
        String value = setting(key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException(key + " must be a number but was: " + value);
        }
    }

    /**
     * Creates the pool (idempotent). Fails fast with a clear message when DB_PASSWORD is missing.
     */
    public static HikariDataSource init() {
        HikariDataSource ds = dataSource;
        if (ds != null) return ds;
        synchronized (DBConnection.class) {
            if (dataSource != null) return dataSource;

            String password = setting("DB_PASSWORD");
            if (password == null) {
                throw new IllegalStateException(
                        "DB_PASSWORD is not set. Set the DB_PASSWORD environment variable before starting the server.");
            }
            String url = setting("DB_URL") != null ? setting("DB_URL") : DEFAULT_URL;
            String user = setting("DB_USER") != null ? setting("DB_USER") : "root";

            HikariConfig config = new HikariConfig();
            config.setPoolName("lms-hikari-pool");
            config.setJdbcUrl(url);
            config.setUsername(user);
            config.setPassword(password);
            config.setMaximumPoolSize(intSetting("DB_POOL_MAX_SIZE", 10));
            config.setMinimumIdle(intSetting("DB_POOL_MIN_IDLE", 2));
            config.setConnectionTimeout(30_000);
            config.setIdleTimeout(600_000);
            config.setMaxLifetime(1_800_000);
            // Do not block application start-up if the database is temporarily down.
            config.setInitializationFailTimeout(-1);

            if (url.startsWith("jdbc:mysql:")) {
                config.addDataSourceProperty("cachePrepStmts", "true");
                config.addDataSourceProperty("prepStmtCacheSize", "250");
                config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
            }

            dataSource = new HikariDataSource(config);
            return dataSource;
        }
    }

    public static Connection getConnection() throws SQLException {
        try {
            return init().getConnection();
        } catch (IllegalStateException e) {
            throw new SQLException(e.getMessage(), e);
        }
    }

    /** Closes the pool (called when Tomcat shuts the application down). */
    public static synchronized void shutdown() {
        if (dataSource != null) {
            dataSource.close();
            dataSource = null;
        }
    }
}
