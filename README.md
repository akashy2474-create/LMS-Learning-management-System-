# 🎓 Online Learning Management System (LMS)

### Java Web-Based Project | Review 1 | Galgotias University

A full-stack **Online Learning Management System (LMS)** designed to simplify online education through centralized course management, student enrollment, learning resources, and academic progress tracking.

Built using **React, TypeScript, Core Java, Jakarta Servlets, JDBC, and MySQL**, the application provides dedicated dashboards for Administrators, Instructors, and Students.

### 👥 User Roles

| Role | Key Responsibilities |
|---|---|
| **Administrator** | User management, course approvals, enrollment approvals, and system analytics |
| **Instructor** | Course creation, learning material management, student progress tracking, and communication |
| **Student** | Course browsing, enrollment, learning materials, and progress tracking |

---

## 🏗️ System Architecture

The LMS follows a layered architecture that connects the React frontend with the Java backend and MySQL database.

```text
┌─────────────────────────────────────────┐
│       React 19 + TypeScript             │
│          Frontend (Port 3000)           │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│          Vite Development Proxy         │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│         Apache Tomcat 10+               │
│          Backend (Port 8080)            │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│    Jakarta Servlets + Authentication    │
│                 Filter                  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│             Service Layer               │
│  UserService, CourseService, etc.       │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│                DAO Layer                │
│  UserDAO, CourseDAO, EnrollmentDAO      │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│             JDBC / MySQL                │
│              Database                  │
│                lms_db                  │
└─────────────────────────────────────────┘
```

### Architecture Components

- **Frontend:** React and TypeScript provide the user interface.
- **Vite:** Runs the frontend development server and proxies API requests when configured.
- **Apache Tomcat:** Hosts the Java web application.
- **Jakarta Servlets:** Handle HTTP requests and responses.
- **Authentication Filter:** Applies authentication checks to configured requests.
- **Service Layer:** Handles application business logic.
- **DAO Layer:** Manages database access operations.
- **JDBC:** Connects the Java backend to MySQL.
- **MySQL:** Stores application data.

## 🚀 Step-by-Step Setup & Execution Guide in VS Code

## 🚀 Setup & Execution Guide

Follow these steps to configure and run the Online Learning Management System using Visual Studio Code.

### 📋 Prerequisites

Ensure the following tools are installed on your system:

| Technology | Minimum Requirement | Verification Command |
|---|---|---|
| Java JDK | 17+ | `java -version` |
| Apache Maven | 3.8+ | `mvn -v` |
| MySQL Server | 8.0+ | `mysql --version` |
| Apache Tomcat | 10.1+ | Verify installation |
| Node.js | 18+ | `node -v` |
| npm | Compatible version | `npm -v` |

### Before You Begin

- Ensure MySQL Server is running.
- Configure Apache Tomcat on port `8080`.
- Verify that Java and Maven are available in your system's PATH.
- Open the project in Visual Studio Code.
- Identify the backend directory containing `pom.xml` and the frontend directory containing `package.json`.

**Note:** The required versions and directory structure must match your actual project configuration.

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
