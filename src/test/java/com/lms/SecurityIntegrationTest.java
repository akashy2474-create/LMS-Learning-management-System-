package com.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.lms.util.DBConnection;
import org.apache.catalina.startup.Tomcat;
import org.junit.jupiter.api.*;

import java.net.http.HttpResponse;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * End-to-end tests of login, session, CSRF, CORS and role checks against the real servlets/filter.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SecurityIntegrationTest {

    private static final String TRUSTED_ORIGIN = "http://localhost:3000";
    private static final String EVIL_ORIGIN = "http://evil.example.com";

    private Tomcat tomcat;
    private int port;

    @BeforeAll
    void startServer() throws Exception {
        TestSupport.configureTestDatabase();
        DBConnection.shutdown();
        tomcat = TestSupport.startServer();
        port = tomcat.getConnector().getLocalPort();
        TestSupport.loadSchema();
    }

    @AfterAll
    void stopServer() throws Exception {
        if (tomcat != null) {
            tomcat.stop();
            tomcat.destroy();
        }
        DBConnection.shutdown();
        TestSupport.clearTestDatabaseConfig();
    }

    private TestSupport.Client client() {
        return new TestSupport.Client(port);
    }

    private static String courseJson() throws Exception {
        return TestSupport.JSON.writeValueAsString(Map.of(
                "title", "Integration Testing 101",
                "description", "Created by an automated test",
                "syllabus", "Unit 1"));
    }

    // ---------------------------------------------------------------- login / session

    @Test
    void loginSucceedsAndIssuesCsrfTokenAndHardenedCookie() throws Exception {
        TestSupport.Client c = client();
        HttpResponse<String> res = c.login("admin@lms.com", "Admin@123");

        assertEquals(200, res.statusCode());
        JsonNode body = TestSupport.JSON.readTree(res.body());
        assertTrue(body.path("success").asBoolean());
        assertEquals("ADMIN", body.path("user").path("role").asText());
        assertFalse(body.path("csrfToken").asText().isBlank(), "login must return a CSRF token");

        String cookie = res.headers().allValues("Set-Cookie").stream()
                .filter(h -> h.startsWith("JSESSIONID=")).findFirst().orElseThrow();
        assertTrue(cookie.contains("HttpOnly"), "session cookie must be HttpOnly: " + cookie);
        assertTrue(cookie.contains("SameSite=Lax"), "session cookie must be SameSite=Lax: " + cookie);
    }

    @Test
    void loginWithWrongPasswordIsRejected() throws Exception {
        HttpResponse<String> res = client().login("admin@lms.com", "wrong-password");
        assertEquals(401, res.statusCode());
        assertFalse(TestSupport.JSON.readTree(res.body()).path("success").asBoolean());
    }

    @Test
    void sessionEndpointReturnsUserAndCsrfToken() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");

        HttpResponse<String> res = c.send("GET", "/api/session", null, null, false);
        assertEquals(200, res.statusCode());
        JsonNode body = TestSupport.JSON.readTree(res.body());
        assertEquals("student@lms.com", body.path("user").path("email").asText());
        assertEquals(c.csrfToken, body.path("csrfToken").asText());
        JsonNode user = body.path("user");
        assertTrue(!user.has("password") || user.get("password").isNull(), "password hash must never be exposed");
    }

    @Test
    void protectedEndpointWithoutSessionIsUnauthorized() throws Exception {
        HttpResponse<String> res = client().send("GET", "/api/admin/users", null, null, false);
        assertEquals(401, res.statusCode());
    }

    @Test
    void studentCannotUseAdminEndpoints() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");
        HttpResponse<String> res = c.send("GET", "/api/admin/users", null, null, true);
        assertEquals(403, res.statusCode());
    }

    @Test
    void loginRotatesSessionIdToPreventFixation() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");
        String firstSession = c.sessionCookie;
        String firstToken = c.csrfToken;
        assertNotNull(firstSession);

        // log in again while still presenting the old session cookie
        c.login("student@lms.com", "Student@123");
        assertNotEquals(firstSession, c.sessionCookie, "a new session id must be issued on login");
        assertNotEquals(firstToken, c.csrfToken, "a new CSRF token must be issued on login");
    }

    // ---------------------------------------------------------------- CSRF

    @Test
    void postWithoutCsrfTokenIsForbidden() throws Exception {
        TestSupport.Client c = client();
        c.login("instructor@lms.com", "Instructor@123");

        HttpResponse<String> res = c.send("POST", "/api/courses", courseJson(), null, false);
        assertEquals(403, res.statusCode());
        assertTrue(res.body().contains("CSRF"), res.body());
    }

    @Test
    void postWithWrongCsrfTokenIsForbidden() throws Exception {
        TestSupport.Client c = client();
        c.login("instructor@lms.com", "Instructor@123");
        c.csrfToken = "not-the-real-token";

        HttpResponse<String> res = c.send("POST", "/api/courses", courseJson(), null, true);
        assertEquals(403, res.statusCode());
    }

    @Test
    void postWithValidCsrfTokenSucceeds() throws Exception {
        TestSupport.Client c = client();
        c.login("instructor@lms.com", "Instructor@123");

        HttpResponse<String> res = c.send("POST", "/api/courses", courseJson(), null, true);
        assertEquals(201, res.statusCode(), res.body());
        assertTrue(TestSupport.JSON.readTree(res.body()).path("success").asBoolean());
    }

    @Test
    void getRequestsDoNotNeedCsrfToken() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");
        HttpResponse<String> res = c.send("GET", "/api/session", null, null, false);
        assertEquals(200, res.statusCode());
    }

    @Test
    void logoutRequiresPostWithCsrfTokenAndEndsSession() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");

        // GET logout is no longer supported (it could be triggered cross-site by an <img> tag)
        assertEquals(405, c.send("GET", "/api/logout", null, null, true).statusCode());
        // POST without token is blocked
        assertEquals(403, c.send("POST", "/api/logout", null, null, false).statusCode());
        // session is still alive after the blocked attempts
        assertEquals(200, c.send("GET", "/api/session", null, null, false).statusCode());

        // POST with token logs out
        assertEquals(200, c.send("POST", "/api/logout", null, null, true).statusCode());
        assertEquals(401, c.send("GET", "/api/admin/users", null, null, true).statusCode());
    }

    // ---------------------------------------------------------------- CORS

    @Test
    void trustedOriginGetsCorsHeaders() throws Exception {
        HttpResponse<String> res = client().send("OPTIONS", "/api/courses", null, TRUSTED_ORIGIN, false);
        assertEquals(200, res.statusCode());
        assertEquals(TRUSTED_ORIGIN, res.headers().firstValue("Access-Control-Allow-Origin").orElse(null));
        assertEquals("true", res.headers().firstValue("Access-Control-Allow-Credentials").orElse(null));
        assertTrue(res.headers().firstValue("Access-Control-Allow-Headers").orElse("").contains("X-CSRF-Token"));
    }

    @Test
    void secondConfiguredOriginIsAlsoTrusted() throws Exception {
        HttpResponse<String> res = client().send("OPTIONS", "/api/courses", null, "https://lms.example.com", false);
        assertEquals("https://lms.example.com", res.headers().firstValue("Access-Control-Allow-Origin").orElse(null));
    }

    @Test
    void untrustedOriginIsRejectedOnPreflight() throws Exception {
        HttpResponse<String> res = client().send("OPTIONS", "/api/courses", null, EVIL_ORIGIN, false);
        assertEquals(403, res.statusCode());
        assertTrue(res.headers().firstValue("Access-Control-Allow-Origin").isEmpty());
        assertTrue(res.headers().firstValue("Access-Control-Allow-Credentials").isEmpty());
    }

    @Test
    void untrustedOriginNeverGetsCorsHeadersOnNormalRequests() throws Exception {
        TestSupport.Client c = client();
        c.login("student@lms.com", "Student@123");
        HttpResponse<String> res = c.send("GET", "/api/session", null, EVIL_ORIGIN, false);
        assertTrue(res.headers().firstValue("Access-Control-Allow-Origin").isEmpty(),
                "origin must not be reflected back");
    }
}
