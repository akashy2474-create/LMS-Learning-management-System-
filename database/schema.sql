-- =========================================================
-- ONLINE LEARNING MANAGEMENT SYSTEM (LMS) - FINAL MYSQL SCHEMA
-- Database: lms_db
-- Target Engine: MySQL 8.0+ / Apache Tomcat 10+ / Jakarta Servlets
-- =========================================================

CREATE DATABASE IF NOT EXISTS `lms_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lms_db`;

DROP TABLE IF EXISTS `material_progress`;
DROP TABLE IF EXISTS `course_materials`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `enrollments`;
DROP TABLE IF EXISTS `courses`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `settings`;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'INSTRUCTOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Courses Table
CREATE TABLE `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `syllabus` TEXT,
  `instructor_id` INT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_courses_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_courses_status` (`status`),
  INDEX `idx_courses_instructor` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Enrollments Table (Supports Student Enrollment Approval Workflow)
CREATE TABLE `enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `progress` INT DEFAULT 0, -- 0 to 100 percentage
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `rejection_reason` VARCHAR(255) DEFAULT NULL,
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT `fk_enrollments_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_student_course` (`student_id`, `course_id`),
  INDEX `idx_enrollments_student` (`student_id`),
  INDEX `idx_enrollments_course` (`course_id`),
  INDEX `idx_enrollments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Course Materials Table (Supports Lesson Text and PDF Documents)
CREATE TABLE `course_materials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `content` LONGTEXT NOT NULL,
  `material_type` ENUM('Lecture', 'Article', 'Lesson', 'Resource') DEFAULT 'Lesson',
  `pdf_data` LONGTEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_materials_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  INDEX `idx_materials_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Material Progress Table
CREATE TABLE `material_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `material_id` INT NOT NULL,
  `completed` BOOLEAN DEFAULT TRUE,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_progress_material` FOREIGN KEY (`material_id`) REFERENCES `course_materials` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_student_material` (`student_id`, `material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Messages Table
CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sender_id` INT NOT NULL,
  `receiver_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  INDEX `idx_messages_receiver` (`receiver_id`),
  INDEX `idx_messages_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. System Settings Table
CREATE TABLE `settings` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `platform_name` VARCHAR(100) NOT NULL DEFAULT 'Online Learning Management System',
  `platform_email` VARCHAR(100) NOT NULL DEFAULT 'admin@lms.com',
  `allow_student_registration` BOOLEAN DEFAULT TRUE,
  `allow_instructor_registration` BOOLEAN DEFAULT TRUE,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- INITIAL SEED DATA WITH VALID BCRYPT HASHES
-- Admin: admin@lms.com / Admin@123
-- Instructor: instructor@lms.com / Instructor@123
-- Student: student@lms.com / Student@123
-- Student 2: rahul@lms.com / Student@123
-- =========================================================

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'System Administrator', 'admin@lms.com', '$2a$10$kgjslZr4rZi1oMaTSzJZ5.QsysldqjinHdPupErgQVmm/WxygkWTy', 'ADMIN'),
(2, 'Prof. Sarah Jenkins', 'instructor@lms.com', '$2a$10$85wjEg922haEBbSErsPL/uxCL4VCk9IBqA7SQFx.qMAYLMdmxvZXy', 'INSTRUCTOR'),
(3, 'Alex Johnson', 'student@lms.com', '$2a$10$M4YBDvuB44KjovqIgM819.L4zMtriEIyxhyqZaNI4iR0E/jTGgtMm', 'STUDENT'),
(4, 'Rahul Sharma', 'rahul@lms.com', '$2a$10$M4YBDvuB44KjovqIgM819.L4zMtriEIyxhyqZaNI4iR0E/jTGgtMm', 'STUDENT');

INSERT INTO `settings` (`id`, `platform_name`, `platform_email`, `allow_student_registration`, `allow_instructor_registration`) VALUES
(1, 'Online Learning Management System', 'admin@lms.com', TRUE, TRUE);

INSERT INTO `courses` (`id`, `title`, `description`, `syllabus`, `instructor_id`, `status`) VALUES
(101, 'Full-Stack Web Development with Java & React', 'Master core Java Servlets, RESTful APIs, JDBC, MySQL, and modern React interfaces.', 'Module 1: Java Basics\nModule 2: JDBC & MySQL\nModule 3: Jakarta Servlets\nModule 4: React Integration', 2, 'APPROVED'),
(102, 'Data Structures & Algorithms in Java', 'Comprehensive guide to arrays, linked lists, trees, graphs, and algorithmic problem solving.', 'Unit 1: Big O Analysis\nUnit 2: Linear Structures\nUnit 3: Trees & Graphs\nUnit 4: Dynamic Programming', 2, 'APPROVED'),
(103, 'Cloud Computing & DevOps Essentials', 'Learn Docker, Kubernetes, CI/CD pipelines, and cloud database administration.', 'Section 1: Containerization\nSection 2: Orchestration\nSection 3: Cloud Deployment', 2, 'PENDING');

INSERT INTO `course_materials` (`id`, `course_id`, `title`, `description`, `content`, `material_type`) VALUES
(201, 101, '1. Introduction to Core Java & Object-Oriented Design', 'Overview of OOP principles: Encapsulation, Inheritance, Polymorphism, and Abstraction.', 'Core Java forms the foundational engine of enterprise software. In this lesson, we cover class structures, constructors, encapsulation, and interface inheritance.', 'Lecture'),
(202, 101, '2. JDBC Fundamentals & Connection Pools', 'Learn how to connect Java applications to MySQL databases safely with PreparedStatements.', 'JDBC (Java Database Connectivity) allows Java applications to execute SQL queries. Always use PreparedStatement to prevent SQL injection vulnerabilities.', 'Lesson'),
(203, 101, '3. Jakarta Servlets & Session Management', 'Understanding HttpServlet, doGet, doPost, and HttpSession lifecycle in Tomcat 10+.', 'Jakarta Servlets handle incoming HTTP requests and generate JSON/HTML responses. Sessions track user authorization state across requests.', 'Article'),
(204, 102, '1. Big O Notation & Algorithmic Time Complexity', 'Learn how to measure algorithmic performance and space-time trade-offs.', 'Big O notation describes the limiting behavior of a function when the argument tends towards a particular value or infinity.', 'Lesson');

INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `progress`, `status`) VALUES
(301, 3, 101, 33, 'APPROVED'),
(302, 4, 102, 0, 'PENDING');

INSERT INTO `material_progress` (`id`, `student_id`, `material_id`, `completed`) VALUES
(401, 3, 201, TRUE);

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `course_id`, `message`, `is_read`) VALUES
(501, 2, 3, 101, 'Welcome to Full-Stack Web Development! Please make sure to review Module 1 lecture notes.', FALSE);
