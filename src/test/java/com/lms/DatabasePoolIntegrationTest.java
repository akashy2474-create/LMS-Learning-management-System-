package com.lms;

import com.lms.util.DBConnection;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.*;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests the HikariCP-backed DBConnection and the "no default password" rule.
 */
class DatabasePoolIntegrationTest {

    @AfterEach
    void cleanUp() {
        DBConnection.shutdown();
        TestSupport.clearTestDatabaseConfig();
        System.clearProperty("DB_POOL_MAX_SIZE");
    }

    @Test
    void connectionsComeFromAHikariPool() throws Exception {
        TestSupport.configureTestDatabase();
        System.setProperty("DB_POOL_MAX_SIZE", "4");
        DBConnection.shutdown();

        HikariDataSource ds = DBConnection.init();
        assertEquals(4, ds.getMaximumPoolSize());
        assertEquals("lms-hikari-pool", ds.getPoolName());

        try (Connection conn = DBConnection.getConnection();
             Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT 1")) {
            assertTrue(rs.next());
            assertEquals(1, rs.getInt(1));
        }
    }

    @Test
    void poolReusesConnectionsInsteadOfOpeningNewOnes() throws Exception {
        TestSupport.configureTestDatabase();
        System.setProperty("DB_POOL_MAX_SIZE", "2");
        DBConnection.shutdown();

        for (int i = 0; i < 20; i++) {
            try (Connection conn = DBConnection.getConnection()) {
                assertTrue(conn.isValid(1));
            }
        }
        assertTrue(DBConnection.init().getHikariPoolMXBean().getTotalConnections() <= 2);
    }

    @Test
    void missingPasswordFailsFastWithClearMessage() {
        Assumptions.assumeTrue(System.getenv("DB_PASSWORD") == null,
                "DB_PASSWORD is set in the environment, skipping");
        TestSupport.configureTestDatabase();
        System.clearProperty("DB_PASSWORD");
        DBConnection.shutdown();

        IllegalStateException ex = assertThrows(IllegalStateException.class, DBConnection::init);
        assertTrue(ex.getMessage().contains("DB_PASSWORD"));

        SQLException sqlEx = assertThrows(SQLException.class, DBConnection::getConnection);
        assertTrue(sqlEx.getMessage().contains("DB_PASSWORD"));
    }
}
