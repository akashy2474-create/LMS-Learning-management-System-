package com.lms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lms.controller.*;
import com.lms.filter.AuthenticationFilter;
import com.lms.util.AppContextListener;
import com.lms.util.DBConnection;
import org.apache.catalina.Context;
import org.apache.catalina.startup.Tomcat;
import org.apache.tomcat.util.descriptor.web.FilterDef;
import org.apache.tomcat.util.descriptor.web.FilterMap;

import java.io.File;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Shared helpers for the integration tests.
 *
 * Starts the REAL servlets + AuthenticationFilter + AppContextListener inside an embedded Tomcat,
 * backed by an in-memory H2 database (MySQL mode) that is seeded from database/schema.sql.
 * No MySQL server or Docker is needed to run the tests.
 */
final class TestSupport {
    static final ObjectMapper JSON = new ObjectMapper();

    private TestSupport() {}

    static void configureTestDatabase() {
        System.setProperty("DB_URL", "jdbc:h2:mem:lms_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
        System.setProperty("DB_USER", "sa");
        System.setProperty("DB_PASSWORD", "test-password");
        System.setProperty("CORS_ALLOWED_ORIGINS", "http://localhost:3000, https://lms.example.com");
    }

    static void clearTestDatabaseConfig() {
        System.clearProperty("DB_URL");
        System.clearProperty("DB_USER");
        System.clearProperty("DB_PASSWORD");
        System.clearProperty("CORS_ALLOWED_ORIGINS");
    }

    /** Loads database/schema.sql (minus the MySQL-only CREATE DATABASE / USE lines) into the test DB. */
    static void loadSchema() throws Exception {
        List<String> lines = Files.readAllLines(Path.of("database", "schema.sql"));
        String script = lines.stream()
                .filter(l -> !l.trim().toUpperCase().startsWith("CREATE DATABASE"))
                .filter(l -> !l.trim().toUpperCase().startsWith("USE "))
                .collect(Collectors.joining("\n"))
                // H2 wants DEFAULT before PRIMARY KEY (MySQL accepts either order)
                .replace("PRIMARY KEY DEFAULT 1", "DEFAULT 1 PRIMARY KEY");
        try (Connection conn = DBConnection.getConnection()) {
            org.h2.tools.RunScript.execute(conn, new StringReader(script));
        }
    }

    static Tomcat startServer() throws Exception {
        Path base = Files.createTempDirectory("lms-tomcat");
        Tomcat tomcat = new Tomcat();
        tomcat.setBaseDir(base.toString());
        tomcat.setPort(0);
        tomcat.getConnector();

        Context ctx = tomcat.addContext("", new File(base.toString()).getAbsolutePath());
        ctx.addApplicationListener(AppContextListener.class.getName());

        addServlet(tomcat, ctx, new LoginServlet(), "login", "/api/login");
        addServlet(tomcat, ctx, new RegisterServlet(), "register", "/api/register");
        addServlet(tomcat, ctx, new SessionServlet(), "session", "/api/session");
        addServlet(tomcat, ctx, new LogoutServlet(), "logout", "/api/logout");
        addServlet(tomcat, ctx, new CourseServlet(), "courses", "/api/courses/*");
        addServlet(tomcat, ctx, new AdminServlet(), "admin", "/api/admin/*");

        FilterDef def = new FilterDef();
        def.setFilterName("authFilter");
        def.setFilter(new AuthenticationFilter());
        ctx.addFilterDef(def);
        FilterMap map = new FilterMap();
        map.setFilterName("authFilter");
        map.addURLPattern("/*");
        ctx.addFilterMap(map);

        tomcat.start();
        return tomcat;
    }

    private static void addServlet(Tomcat tomcat, Context ctx, jakarta.servlet.Servlet servlet, String name, String pattern) {
        Tomcat.addServlet(ctx, name, servlet);
        ctx.addServletMappingDecoded(pattern, name);
    }

    /** Small HTTP client wrapper that keeps a session cookie by hand. */
    static final class Client {
        private final HttpClient http = HttpClient.newHttpClient();
        private final String baseUrl;
        String sessionCookie; // e.g. JSESSIONID=abc
        String csrfToken;

        Client(int port) {
            this.baseUrl = "http://localhost:" + port;
        }

        HttpResponse<String> send(String method, String path, String body, String origin, boolean withCsrf) throws Exception {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(baseUrl + path));
            b.header("Content-Type", "application/json");
            if (sessionCookie != null) b.header("Cookie", sessionCookie);
            if (withCsrf && csrfToken != null) b.header("X-CSRF-Token", csrfToken);
            if (origin != null) b.header("Origin", origin);
            // "Origin" is a restricted header in java.net.http unless allowed explicitly (see TestSupport static block)
            b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
            HttpResponse<String> res = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
            res.headers().allValues("Set-Cookie").stream()
                    .filter(c -> c.startsWith("JSESSIONID="))
                    .findFirst()
                    .ifPresent(c -> sessionCookie = c.split(";", 2)[0]);
            return res;
        }

        HttpResponse<String> login(String email, String password) throws Exception {
            String body = JSON.writeValueAsString(java.util.Map.of("email", email, "password", password));
            HttpResponse<String> res = send("POST", "/api/login", body, null, false);
            if (res.statusCode() == 200) {
                JsonNode node = JSON.readTree(res.body());
                csrfToken = node.path("csrfToken").asText(null);
            }
            return res;
        }
    }

    static {
        // Allow tests to send an Origin header with java.net.http
        System.setProperty("jdk.httpclient.allowRestrictedHeaders", "origin");
    }
}
