# System Architecture, Design Diagrams & Rubric Documentation
### Online Learning Management System (LMS) — Java Web Based Project Review 1

---

## 1. Problem Statement & Solution Design

### 1.1 Problem Statement
Educational institutions require a secure, multi-role web platform where:
- **Administrators** govern users, approve or reject instructor-created courses, moderate student course enrollment requests with multi-step transactions, and configure system-wide registration rules.
- **Instructors** author course curricula, upload structured educational lessons and downloadable PDF documents, and monitor enrolled students' progress.
- **Students** browse verified courses, request enrollments, access lessons and PDFs once approved, track completion progress, and communicate with instructors.

### 1.2 System Architecture
The system follows a strict **N-Tier Enterprise Architecture**:

```
+-------------------------------------------------------------+
|                      PRESENTATION TIER                      |
|  React 19 + TypeScript + Vite + Tailwind CSS (Port 3000)    |
|  - Role-Based Dynamic UI (Admin, Instructor, Student)       |
|  - Credentials: "include" for native JSESSIONID cookie auth |
|  - Centralized API Client (src/services/api.ts)             |
+-------------------------------------------------------------+
                              │ HTTP / JSON (Port 3000 -> 8080)
                              ▼
+-------------------------------------------------------------+
|                     WEB & CONTROLLER TIER                   |
|  Apache Tomcat 10+ (Jakarta Servlet API 6.0 / Port 8080)    |
|  - AuthenticationFilter: CORS, JSESSIONID validation, RBAC  |
|  - Servlets: LoginServlet, RegisterServlet, LogoutServlet,  |
|    SessionServlet, CourseServlet, EnrollmentServlet,        |
|    MaterialServlet, MessageServlet, AdminServlet, etc.      |
+-------------------------------------------------------------+
                              │ Method Calls
                              ▼
+-------------------------------------------------------------+
|                       SERVICE LAYER                         |
|  Pure Core Java Business Logic & Security Validation        |
|  - UserService, CourseService, EnrollmentService,           |
|    MaterialService, MessageService, SettingsService         |
|  - Custom Exceptions (Validation, Authorization, etc.)      |
|  - ThreadPoolManager (Asynchronous Worker Pool)             |
+-------------------------------------------------------------+
                              │ Method Calls
                              ▼
+-------------------------------------------------------------+
|                      DATA ACCESS LAYER                      |
|  DAO Pattern with Pure Java Database Connectivity (JDBC)   |
|  - UserDAO, CourseDAO, EnrollmentDAO, MaterialDAO,         |
|    MessageDAO, SettingsDAO, AnalyticsDAO                    |
|  - PreparedStatement, ResultSet, Try-With-Resources         |
|  - ACID Transactions: conn.setAutoCommit(false), commit()   |
+-------------------------------------------------------------+
                              │ JDBC Driver (com.mysql.cj.jdbc)
                              ▼
+-------------------------------------------------------------+
|                       PERSISTENCE TIER                      |
|  MySQL 8.0 Relational Database (lms_db)                     |
|  - 3NF Normalized Schema with Foreign Keys & Cascades       |
|  - Tables: users, courses, enrollments, course_materials,   |
|    material_progress, messages, settings                    |
+-------------------------------------------------------------+
```

---

## 2. Rubric Mapping & Proof of Implementation (33 Marks)

### A. Core Java Concepts (10 Marks)

1. **Object-Oriented Programming (OOP)**:
   - **Encapsulation**: Domain entities (`User`, `Course`, `Enrollment`, `CourseMaterial`, `Message`, `Settings`) have private fields with explicit getters/setters.
   - **Data Integrity**: Security annotations (`@JsonProperty(access = WRITE_ONLY)`) prevent password hash leakage.
   - **Separation of Concerns**: Clean Controller -> Service -> DAO -> Model layering.

2. **Collections Framework**:
   - `java.util.List` / `java.util.ArrayList`: Storing and iterating over collections of courses, enrollments, materials, and messages.
   - `java.util.Map` / `java.util.HashMap`: Aggregating system statistics in `AnalyticsDAO` and constructing JSON response payloads.
   - `java.util.Set` / `java.util.HashSet`: Constant-time $O(1)$ role validation (`VALID_ROLES`) in `UserService`, public route filtering (`PUBLIC_ENDPOINTS`) in `AuthenticationFilter`, and completed material IDs in `MaterialDAO.getCompletedMaterialIds`.

3. **Exception Handling**:
   - Hierarchy rooted in `LmsException` containing HTTP status codes.
   - Custom exceptions: `ValidationException` (400), `AuthenticationException` (401), `AuthorizationException` (403), `ResourceNotFoundException` (404), `DatabaseException` (500).
   - Clean JSON error responses without leaking stack traces.

4. **Multi-Threading & Concurrency**:
   - Managed `ThreadPoolManager` utilizing `java.util.concurrent.ExecutorService` with a fixed pool of daemon worker threads.
   - Non-blocking asynchronous tasks for student notification messages, welcome emails, and audit logs triggered during course/enrollment approvals.
   - Lifecycle registered in `AppContextListener` (`contextInitialized` / `contextDestroyed`) to prevent thread leakage upon Tomcat shutdown.

---

### B. Database Integration & JDBC (8 Marks)

1. **Schema Design**:
   - Normalized 3NF MySQL 8 schema (`database/schema.sql`).
   - Referential integrity enforced with `FOREIGN KEY ... ON DELETE CASCADE`.
   - Optimized indexes on frequently queried columns (`role`, `status`, `student_id`, `course_id`).

2. **Secure JDBC Operations**:
   - `PreparedStatement` parameterization prevents SQL injection.
   - `try-with-resources` ensures automatic closing of `Connection`, `PreparedStatement`, and `ResultSet`.

3. **ACID Transaction Handling (Commit & Rollback)**:
   - Demonstrated in `EnrollmentDAO.approveEnrollmentTransaction` and `EnrollmentDAO.rejectEnrollmentTransaction`:
     ```java
     conn.setAutoCommit(false);
     try {
         // Step 1: Update enrollment status to APPROVED
         // Step 2: Query student and course details
         // Step 3: Insert system notification message
         conn.commit(); // Atomically lock changes
     } catch (SQLException e) {
         conn.rollback(); // Restore previous state on failure
         throw new DatabaseException("Transaction failed", e);
     } finally {
         conn.setAutoCommit(true);
     }
     ```

---

### C. Servlets & Web Integration (7 Marks)

1. **Request & Response Lifecycle**:
   - Standard Jakarta HTTP Servlets (`HttpServlet`) utilizing `doGet`, `doPost`, `doPut`, `doDelete`.
   - Unified JSON request consumption and response serialization via Jackson `ObjectMapper`.

2. **Session Management**:
   - Cookie-based session tracking using standard `HttpSession` and `JSESSIONID`.
   - `LoginServlet` invokes `request.getSession(true)` and binds `userId`, `name`, `email`, `role`.
   - `LogoutServlet` invalidates sessions with `session.invalidate()`.
   - `AuthenticationFilter` validates active sessions and enforces Role-Based Access Control (RBAC).

---

## 3. Detailed Design Diagrams

### 3.1 Use Case Diagram

```
                       +-----------------------+
                       |    ONLINE LMS ACTORS  |
                       +-----------------------+

       (STUDENT)              (INSTRUCTOR)              (ADMINISTRATOR)
          │                        │                           │
          ├── Register Account     ├── Create Course           ├── Approve/Reject Course
          ├── Login / Logout       ├── Edit/Delete Course      ├── Approve/Reject Enrollment
          ├── Browse Courses       ├── Upload Lessons & PDFs   ├── Manage Users (CRUD)
          ├── Request Enrollment   ├── Edit/Delete Materials   ├── Configure System Settings
          ├── View Lessons & PDFs  ├── View Enrolled Students  └── View System Analytics
          ├── Mark Lesson Complete └── Send Direct Messages
          └── Send Direct Messages
```

---

### 3.2 Entity-Relationship (ER) Diagram

```
 +--------------------+       1:N       +----------------------+
 |       USERS        | ───────────────<|       COURSES        |
 +--------------------+                 +----------------------+
 | PK  id             |                 | PK  id               |
 |     name           |                 | FK  instructor_id    |
 |     email (UNIQUE) |                 |     title            |
 |     password       |                 |     description      |
 |     role           |                 |     syllabus         |
 |     created_at     |                 |     status           |
 +--------------------+                 |     rejection_reason |
          │ 1                           +----------------------+
          │                                        │ 1
          │ 1:N                                    │ 1:N
          ▼                                        ▼
 +--------------------+       N:1       +----------------------+
 |    ENROLLMENTS     | >───────────────|   COURSE_MATERIALS   |
 +--------------------+                 +----------------------+
 | PK  id             |                 | PK  id               |
 | FK  student_id     |                 | FK  course_id        |
 | FK  course_id      |                 |     title            |
 |     progress       |                 |     description      |
 |     status         |                 |     content          |
 |     rejection_reas.|                 |     material_type    |
 |     enrolled_at    |                 |     pdf_data         |
 +--------------------+                 +----------------------+
          │ 1                                      │ 1
          │ 1:N                                    │ 1:N
          ▼                                        ▼
 +--------------------+                 +----------------------+
 |      MESSAGES      |                 |  MATERIAL_PROGRESS   |
 +--------------------+                 +----------------------+
 | PK  id             |                 | PK  id               |
 | FK  sender_id      |                 | FK  student_id       |
 | FK  receiver_id    |                 | FK  material_id      |
 | FK  course_id      |                 |     completed        |
 |     message        |                 |     completed_at     |
 |     is_read        |                 +----------------------+
 +--------------------+
```

---

### 3.3 Authentication & Session Sequence Diagram

```
React (Port 3000)          Vite Proxy        LoginServlet (8080)     UserService       UserDAO / MySQL
      │                         │                    │                    │                   │
      ├─ POST /api/login ──────►├─ Forward ─────────►│                    │                   │
      │  {email, password}      │  credentials:incl  ├─ authenticateUser ─►│                   │
      │                         │                    │  (email, password) ├─ findUserByEmail ─►│
      │                         │                    │                    │◄─ User (BCrypt) ──┤
      │                         │                    │                    │  [Verify Hash]    │
      │                         │                    │◄─ User Authenticated                   │
      │                         │                    │                    │                   │
      │                         │                    ├─ req.getSession(true)                  │
      │                         │                    ├─ setAttribute("userId", id)            │
      │                         │                    ├─ setAttribute("role", role)            │
      │                         │                    │                                        │
      │◄─ HTTP 200 OK ──────────┼◄─ Set-Cookie ──────┤                                        │
      │   Set-Cookie:           │   JSESSIONID=...   │                                        │
      │   JSESSIONID=...        │   {user DTO}       │                                        │
      │                         │                    │                                        │
      │   [Subsequent Request]  │                    │                                        │
      ├─ GET /api/session ─────►├─ Forward ─────────►│ SessionServlet                         │
      │  Cookie: JSESSIONID=... │  Cookie: JSESS...  │ [Validates session attributes]         │
      │◄─ HTTP 200 {user} ──────┼◄───────────────────┤                                        │
```

---

### 3.4 Student Enrollment Approval Sequence Diagram (ACID Transaction)

```
Student Portal           EnrollmentServlet         Admin Approvals Hub     EnrollmentDAO (Transaction)
      │                         │                           │                         │
      ├─ POST /api/enrollments ─►│                           │                         │
      │  {courseId: 101}        ├─ createEnrollment(PENDING)                          │
      │                         │  status = 'PENDING'       │                         │
      │◄─ "Enrollment Pending" ─┤                           │                         │
      │   (Materials locked)    │                           │                         │
      │                         │                           │                         │
      │                         │                           ├─ POST /approve ────────►│
      │                         │                           │  enrollmentId = 301     ├─ setAutoCommit(false)
      │                         │                           │                         ├─ 1. UPDATE enrollments
      │                         │                           │                         │     SET status='APPROVED'
      │                         │                           │                         ├─ 2. SELECT course,student
      │                         │                           │                         ├─ 3. INSERT notification
      │                         │                           │                         ├─ commit()
      │                         │                           │◄─ Success 200 OK ───────┤
      │                         │                           │                         │
      │   [Student Refreshes]   │                           │                         │
      ├─ GET /api/materials ───►│ MaterialServlet                                     │
      │                         ├─ Checks enrollment status == 'APPROVED'             │
      │◄─ 200 OK [Lessons,PDFs] ┤ (Course Player Unlocked!)                           │
```
