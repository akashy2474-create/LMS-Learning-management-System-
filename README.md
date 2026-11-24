# Online Learning Management System (LMS)

### Java Web-Based Project – Galgotias University

A full-stack Online Learning Management System built using **React 19, TypeScript, Java Jakarta Servlets, JDBC, and MySQL 8.0**, deployed on Apache Tomcat.

The application provides separate dashboards for Administrators, Instructors, and Students to manage courses, enrollments, learning materials, and student progress.

---

## 🏗️ System Architecture

```text
React 19 + TypeScript (Port 3000)
             ↓
       HTTP / JSON
             ↓
      API Proxy (Vite)
             ↓
    Apache Tomcat 10+
             ↓
       Java Servlets
             ↓
       Service Layer
             ↓
          DAO Layer
             ↓
       JDBC + HikariCP
             ↓
         MySQL 8.0
```

The application follows a layered architecture that separates the frontend, business logic, database operations, and data storage.

---

## 🎯 Main Features

### Administrator
- Manage student and instructor accounts.
- Review and approve courses.
- Approve or reject enrollment requests.
- Manage platform settings and analytics.

### Instructor
- Create, edit, and manage courses.
- Add lessons and PDF materials.
- View enrolled students.
- Track student learning progress.

### Student
- Browse available courses.
- Request course enrollment.
- Access approved learning materials.
- Track learning progress.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| UI Styling | Tailwind CSS |
| Backend | Java 17, Jakarta Servlets 6.0 |
| Server | Apache Tomcat 10.1+ |
| Database | MySQL 8.0 |
| Connectivity | JDBC |
| Connection Pool | HikariCP |
| Build Tool | Maven |
| Testing | JUnit 5, H2, Embedded Tomcat |
| Development Server | Node.js, Express, Vite |

---

## 📁 Project Structure

```text
LMS/
├── database/
│   └── schema.sql
├── docs/
│   └── ARCH_AND_DIAGRAMS.md
├── src/
│   ├── main/java/com/lms/
│   │   ├── controller/
│   │   ├── dao/
│   │   ├── exception/
│   │   ├── filter/
│   │   ├── model/
│   │   ├── service/
│   │   └── util/
│   ├── test/java/com/lms/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   └── types/
├── .github/workflows/
│   └── ci.yml
├── .gitignore
├── .env.example
├── package.json
├── pom.xml
├── server.ts
└── vite.config.ts
```

---

## 🗄️ Database Design

The project uses MySQL 8.0 with seven main relational tables.

| Table | Purpose |
|---|---|
| Users | User details and roles |
| Courses | Course information |
| Enrollments | Student enrollment requests |
| Course Materials | Lessons and PDF materials |
| Material Progress | Student learning progress |
| Messages | User communication |
| Settings | Platform settings |

Database relationships are maintained using primary keys, foreign keys, and constraints.

Database schema: `database/schema.sql`

---

## 🔐 Security Implementation

The following security improvements have been implemented in the Java backend:

1. **CSRF Protection:** Validates CSRF tokens for state-changing requests using the `X-CSRF-Token` header.
2. **Session Security:** Regenerates sessions after login, invalidates old sessions, and uses HttpOnly and SameSite cookies.
3. **Trusted CORS Origins:** Restricts credentialed cross-origin requests to configured trusted origins.
4. **Database Password Security:** Requires `DB_PASSWORD` through environment configuration without an insecure default password.
5. **Connection Pooling:** Uses HikariCP for efficient database connection management.
6. **Automated Tests:** Includes integration tests for authentication, sessions, CSRF, CORS, and database pooling.

---

## ⚙️ Database Connectivity

The backend uses JDBC to connect Java Servlets with MySQL.

- HikariCP manages database connections.
- DAO classes handle SQL operations.
- PreparedStatement is used for parameterized queries.
- Service classes handle business logic.
- Transactions maintain consistency during multi-step operations.

---

## 🚀 Setup & Execution Guide

### Prerequisites

1. Java JDK 17+
2. Apache Maven 3.8+
3. MySQL Server 8.0+
4. Apache Tomcat 10.1+
5. Node.js 18+ and npm

### Step 1: Clone Repository

```bash
git clone https://github.com/akashy2474-create/LMS-Learning-management-System-.git

cd LMS-Learning-management-System-
```

### Step 2: Setup Database

Run MySQL and execute:

```bash
mysql -u root -p < database/schema.sql
```

This creates the `lms_db` database, tables, constraints, and initial demo accounts.

### Step 3: Configure Database

Set the environment variables before starting Tomcat.

Windows CMD:

```cmd
set DB_USER=root
set DB_PASSWORD=your_mysql_password
set DB_URL=jdbc:mysql://localhost:3306/lms_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

### Step 4: Build Java Backend

```bash
mvn clean package
```

The generated WAR file will be available at:

```text
target/lms-api.war
```

### Step 5: Deploy on Tomcat

Copy `lms-api.war` into the Tomcat `webapps` folder and start Tomcat.

Verify backend:

```text
http://localhost:8080/lms-api/api/health
```

### Step 6: Start Frontend

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Administrator | admin@lms.com | Admin@123 |
| Instructor | instructor@lms.com | Instructor@123 |
| Student | student@lms.com | Student@123 |
| Student 2 | rahul@lms.com | Student@123 |

These accounts are for local demonstration only.

---

## 🔄 Core Workflows

### 1. Course Creation and Approval

1. Instructor creates a course.
2. Administrator reviews the course.
3. Administrator approves or rejects it.
4. Approved courses become available to students.

### 2. Student Enrollment

1. Student selects an available course.
2. Enrollment request is submitted.
3. Administrator reviews the request.
4. On approval, the student gets access to course materials.

### 3. Learning Progress

1. Students access approved learning materials.
2. Students complete lessons.
3. Progress is stored in the database.
4. Students and instructors can view learning progress.

---

## 🧪 Testing

Automated integration tests are included using JUnit 5, Embedded Tomcat, and H2.

Run tests:

```bash
mvn test
```

Build backend:

```bash
mvn clean package
```

Build frontend:

```bash
npm run build
```

Tests cover authentication, session management, CSRF validation, CORS restrictions, role-based access, and database connection pooling.

---

## 🔄 GitHub Actions

The project includes a GitHub Actions workflow at:

`.github/workflows/ci.yml`

It automatically runs backend tests on configured pushes and pull requests.

Generated files such as `.class`, `.war`, `target/`, and `node_modules/` are excluded using `.gitignore`.

---

## 📌 Future Improvements

- Online quizzes and assessments.
- Course ratings and feedback.
- Certificate generation.
- Email notifications.
- Advanced learning analytics.

---



https://github.com/akashy2474-create/LMS-Learning-management-System-

**Developed as a Java Web-Based Learning Management System Project.**
