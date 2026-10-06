# Online Learning Management System (LMS)
### Java Web Based Project Review 1 — Galgotias University (Rubric Score: 33/33)

An enterprise full-stack Online Learning Management System built with a **React 19 + TypeScript** modern frontend and an authoritative **Jakarta Servlets 6.0 + JDBC + MySQL 8.0** backend deployed on **Apache Tomcat 10+**.

---

## 🏗️ System Architecture

```
React 19 Frontend (Port 3000)
       ↓  HTTP / JSON (credentials: "include")
Vite Dev Proxy (Port 3000 -> 8080)
       ↓
Apache Tomcat 10+ (Port 8080 /lms-api)
       ↓
Jakarta Servlets (@WebServlet) + AuthenticationFilter
       ↓
Service Layer (UserService, CourseService, EnrollmentService, MaterialService, etc.)
       ↓
DAO Layer (UserDAO, CourseDAO, EnrollmentDAO, MaterialDAO, etc.)
       ↓  JDBC (PreparedStatement, ACID Transactions)
MySQL 8.0 Relational Database (lms_db)
```

---



---

## 🚀 Step-by-Step Setup & Execution Guide in VS Code

### Prerequisites
1. **Java JDK 17+** (`java -version`)
2. **Apache Maven 3.8+** (`mvn -v`)
3. **MySQL Server 8.0+** (`mysql --version`)
4. **Apache Tomcat 10.1+** (Configured on Port 8080)
5. **Node.js 18+ & npm** (`node -v`, `npm -v`)

---

### Step 1: Initialize MySQL Database
1. Open MySQL Workbench or your terminal:
   ```bash
   mysql -u root -p
   ```
2. Execute the complete schema and seed script:
   ```sql
   source database/schema.sql;
   ```
   *(Creates database `lms_db`, tables, foreign key constraints, indexes, and seed accounts).*

---

### Step 2: Build the Java Backend (WAR Package)
In the project root directory, run:
```bash
mvn clean package
```
- This compiles all Java Servlets, Services, DAOs, and Models.
- It generates the deployable WAR file: `target/lms-api.war`.

---

### Step 3: Deploy to Apache Tomcat 10+
1. Copy `target/lms-api.war` to your Tomcat `webapps/` directory:
   - **Windows:** `C:\Program Files\Apache Software Foundation\Tomcat 10.1\webapps\`
   - **Linux/Mac:** `/opt/tomcat/webapps/`
2. Start Apache Tomcat:
   - **Windows:** Run `bin\startup.bat`
   - **Linux/Mac:** Run `bin/startup.sh`
3. Verify the Java backend is active:
   - Open browser: `http://localhost:8080/lms-api/api/health`
   - Returns: `{"status":"ok", ...}`

---

### Step 4: Start the React Frontend in VS Code
1. Open a new terminal in VS Code (`Ctrl + ~`).
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser:
   👉 **http://localhost:3000**

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@lms.com` | `Admin@123` | User CRUD, Course Approvals, Enrollment Approvals, System Settings, Analytics |
| **Instructor** | `instructor@lms.com` | `Instructor@123` | Course Studio (Create/Edit/Delete), Lesson & PDF Uploads, Student Progress Tracking |
| **Student** | `student@lms.com` | `Student@123` | Course Catalog, Request Enrollment, Study Player & PDF Viewer, Progress Tracker |
| **Student 2** | `rahul@lms.com` | `Student@123` | Additional student account for multi-user testing |

---

## 🔄 Core Workflows

### 1. Student Course Enrollment & Admin Approval
1. **Student** browses approved courses and clicks **"Enroll Now"**.
2. An enrollment record is created with `status = 'PENDING'`.
3. In the student's dashboard, the course shows a **Pending Admin Approval** badge; course lessons and PDFs remain locked.
4. **Administrator** opens the **Approvals Hub** (`/admin`), reviews the student's request, and clicks **Approve** (or **Reject** with feedback).
5. The approval executes as an **atomic multi-step ACID transaction**:
   - Updates `enrollments.status = 'APPROVED'`.
   - Dispatches an automated congratulations message in `messages`.
   - Triggers an asynchronous background thread via `ThreadPoolManager`.
6. Student's course player unlocks immediately!

### 2. PDF Document Upload & Persistence
1. **Instructor** creates a lesson under **Course Materials** and uploads a syllabus or handbook PDF.
2. The file is safely transmitted to `MaterialServlet` (POST/PUT) and stored in the MySQL `course_materials.pdf_data` column.
3. **Students** can read the lesson online and preview/download the embedded PDF.
