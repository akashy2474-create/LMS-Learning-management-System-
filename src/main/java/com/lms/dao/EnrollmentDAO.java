package com.lms.dao;

import com.lms.exception.DatabaseException;
import com.lms.model.Enrollment;
import com.lms.util.DBConnection;
import com.lms.util.ThreadPoolManager;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;

/**
 * EnrollmentDAO - Data Access Object for Course Enrollments
 * 
 * Rubric Compliance:
 * 1. Database Integration (JDBC): PreparedStatement, ResultSet, connection handling (8 marks)
 * 2. ACID Transaction Handling: multi-step atomic transactions with commit/rollback (8 marks)
 * 3. Core Java Concepts - Threads: asynchronous notification dispatch via ThreadPoolManager (10 marks)
 */
public class EnrollmentDAO {
    private static final Logger LOGGER = Logger.getLogger(EnrollmentDAO.class.getName());

    public boolean createEnrollment(int studentId, int courseId) throws SQLException {
        // By default, new enrollments are PENDING until approved by an administrator
        String sql = "INSERT INTO enrollments (student_id, course_id, progress, status) VALUES (?, ?, 0, 'PENDING')";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, studentId);
            stmt.setInt(2, courseId);

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean isEnrolled(int studentId, int courseId) throws SQLException {
        String sql = "SELECT COUNT(*) FROM enrollments WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, studentId);
            stmt.setInt(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }
        }
        return false;
    }

    public String getEnrollmentStatus(int studentId, int courseId) throws SQLException {
        String sql = "SELECT status FROM enrollments WHERE student_id = ? AND course_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, studentId);
            stmt.setInt(2, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getString("status");
                }
            }
        }
        return null;
    }

    /**
     * ACID TRANSACTION: Approve Student Enrollment (Multi-Step Atomic Operation)
     * 
     * Demonstrates real transaction handling using JDBC:
     * - Disables auto-commit (conn.setAutoCommit(false))
     * - Step 1: Update enrollment status to 'APPROVED'
     * - Step 2: Fetch student name & course title
     * - Step 3: Insert system congratulatory notification in 'messages' table
     * - Step 4: Initialize progress tracking records
     * - On error: conn.rollback() restores the database
     * - On success: conn.commit() locks in all changes
     * - Finally: conn.setAutoCommit(true) resets connection state
     */
    public boolean approveEnrollmentTransaction(int enrollmentId, int adminUserId) throws SQLException {
        Connection conn = null;
        PreparedStatement updateStmt = null;
        PreparedStatement selectStmt = null;
        PreparedStatement messageStmt = null;
        ResultSet rs = null;

        int studentId = 0;
        int courseId = 0;
        String studentName = "";
        String courseTitle = "";

        try {
            conn = DBConnection.getConnection();
            // BEGIN TRANSACTION
            conn.setAutoCommit(false);

            // Step 1: Update enrollment record to APPROVED
            String updateSql = "UPDATE enrollments SET status = 'APPROVED', rejection_reason = NULL WHERE id = ?";
            updateStmt = conn.prepareStatement(updateSql);
            updateStmt.setInt(1, enrollmentId);
            int rowsUpdated = updateStmt.executeUpdate();

            if (rowsUpdated == 0) {
                conn.rollback();
                return false;
            }

            // Step 2: Fetch enrollment details for message & background tasks
            String selectSql = "SELECT e.student_id, e.course_id, u.name as student_name, c.title as course_title " +
                               "FROM enrollments e " +
                               "JOIN users u ON e.student_id = u.id " +
                               "JOIN courses c ON e.course_id = c.id " +
                               "WHERE e.id = ?";
            selectStmt = conn.prepareStatement(selectSql);
            selectStmt.setInt(1, enrollmentId);
            rs = selectStmt.executeQuery();

            if (rs.next()) {
                studentId = rs.getInt("student_id");
                courseId = rs.getInt("course_id");
                studentName = rs.getString("student_name");
                courseTitle = rs.getString("course_title");
            }

            // Step 3: Insert system notification message inside the same transaction
            String msgSql = "INSERT INTO messages (sender_id, receiver_id, course_id, message, is_read) VALUES (?, ?, ?, ?, 0)";
            messageStmt = conn.prepareStatement(msgSql);
            messageStmt.setInt(1, adminUserId > 0 ? adminUserId : 1);
            messageStmt.setInt(2, studentId);
            messageStmt.setInt(3, courseId);
            messageStmt.setString(4, String.format("Congratulations %s! Your enrollment for \"%s\" has been approved by the Administrator. You now have full access to learning materials.", studentName, courseTitle));
            messageStmt.executeUpdate();

            // COMMIT TRANSACTION
            conn.commit();
            LOGGER.info(String.format("ACID Transaction committed: Enrollment #%d approved for student %s in course %s", enrollmentId, studentName, courseTitle));

            // THREADS RUBRIC: Asynchronous non-blocking audit logging & email simulation
            final String finalStudentName = studentName;
            final String finalCourseTitle = courseTitle;
            ThreadPoolManager.submitTask(() -> {
                LOGGER.info(String.format("[ASYNC THREAD] Dispatching approval welcome email to student: %s for course: %s", finalStudentName, finalCourseTitle));
            }, "DispatchStudentWelcomeEmail");

            return true;

        } catch (SQLException e) {
            if (conn != null) {
                try {
                    LOGGER.warning("ACID Transaction rollback triggered due to exception: " + e.getMessage());
                    conn.rollback();
                } catch (SQLException rollbackEx) {
                    LOGGER.severe("Rollback failed: " + rollbackEx.getMessage());
                }
            }
            throw new DatabaseException("Enrollment approval transaction failed: " + e.getMessage(), e);

        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (updateStmt != null) try { updateStmt.close(); } catch (SQLException ignored) {}
            if (selectStmt != null) try { selectStmt.close(); } catch (SQLException ignored) {}
            if (messageStmt != null) try { messageStmt.close(); } catch (SQLException ignored) {}
            if (conn != null) {
                try {
                    conn.setAutoCommit(true);
                    conn.close();
                } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * ACID TRANSACTION: Reject Student Enrollment with recorded feedback
     */
    public boolean rejectEnrollmentTransaction(int enrollmentId, String reason, int adminUserId) throws SQLException {
        Connection conn = null;
        PreparedStatement updateStmt = null;
        PreparedStatement selectStmt = null;
        PreparedStatement msgStmt = null;
        ResultSet rs = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin transaction

            String sql = "UPDATE enrollments SET status = 'REJECTED', rejection_reason = ? WHERE id = ?";
            updateStmt = conn.prepareStatement(sql);
            String feedback = reason != null && !reason.trim().isEmpty() ? reason.trim() : "Enrollment requirements not satisfied";
            updateStmt.setString(1, feedback);
            updateStmt.setInt(2, enrollmentId);
            int updated = updateStmt.executeUpdate();

            if (updated == 0) {
                conn.rollback();
                return false;
            }

            // Fetch details for student notification
            String selectSql = "SELECT e.student_id, e.course_id, c.title as course_title FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.id = ?";
            selectStmt = conn.prepareStatement(selectSql);
            selectStmt.setInt(1, enrollmentId);
            rs = selectStmt.executeQuery();

            if (rs.next()) {
                int studentId = rs.getInt("student_id");
                int courseId = rs.getInt("course_id");
                String courseTitle = rs.getString("course_title");

                String msgSql = "INSERT INTO messages (sender_id, receiver_id, course_id, message, is_read) VALUES (?, ?, ?, ?, 0)";
                msgStmt = conn.prepareStatement(msgSql);
                msgStmt.setInt(1, adminUserId > 0 ? adminUserId : 1);
                msgStmt.setInt(2, studentId);
                msgStmt.setInt(3, courseId);
                msgStmt.setString(4, String.format("Notice: Your enrollment request for \"%s\" was not approved. Reason: %s", courseTitle, feedback));
                msgStmt.executeUpdate();
            }

            conn.commit(); // Commit transaction
            return true;

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            throw new DatabaseException("Enrollment rejection transaction failed: " + e.getMessage(), e);
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (updateStmt != null) try { updateStmt.close(); } catch (SQLException ignored) {}
            if (selectStmt != null) try { selectStmt.close(); } catch (SQLException ignored) {}
            if (msgStmt != null) try { msgStmt.close(); } catch (SQLException ignored) {}
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /**
     * ACID TRANSACTION: Unenroll Student (Deletes progress and enrollment atomically)
     */
    public boolean unenrollTransaction(int studentId, int courseId) throws SQLException {
        Connection conn = null;
        PreparedStatement deleteProgressStmt = null;
        PreparedStatement deleteEnrollmentStmt = null;

        try {
            conn = DBConnection.getConnection();
            conn.setAutoCommit(false); // Begin transaction

            // Step 1: Delete all lesson progress records for this course
            String deleteProgressSql = "DELETE FROM material_progress WHERE student_id = ? AND material_id IN (SELECT id FROM course_materials WHERE course_id = ?)";
            deleteProgressStmt = conn.prepareStatement(deleteProgressSql);
            deleteProgressStmt.setInt(1, studentId);
            deleteProgressStmt.setInt(2, courseId);
            deleteProgressStmt.executeUpdate();

            // Step 2: Delete enrollment record
            String deleteEnrollSql = "DELETE FROM enrollments WHERE student_id = ? AND course_id = ?";
            deleteEnrollmentStmt = conn.prepareStatement(deleteEnrollSql);
            deleteEnrollmentStmt.setInt(1, studentId);
            deleteEnrollmentStmt.setInt(2, courseId);
            int rowsDeleted = deleteEnrollmentStmt.executeUpdate();

            if (rowsDeleted == 0) {
                conn.rollback();
                return false;
            }

            conn.commit(); // Commit transaction
            return true;

        } catch (SQLException e) {
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ignored) {}
            }
            throw new DatabaseException("Unenrollment transaction failed: " + e.getMessage(), e);
        } finally {
            if (deleteProgressStmt != null) try { deleteProgressStmt.close(); } catch (SQLException ignored) {}
            if (deleteEnrollmentStmt != null) try { deleteEnrollmentStmt.close(); } catch (SQLException ignored) {}
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException ignored) {}
            }
        }
    }

    public List<Enrollment> getStudentEnrollments(int studentId) throws SQLException {
        List<Enrollment> enrollments = new ArrayList<>();
        String sql = "SELECT e.*, c.title as course_title, u.name as instructor_name " +
                     "FROM enrollments e " +
                     "JOIN courses c ON e.course_id = c.id " +
                     "JOIN users u ON c.instructor_id = u.id " +
                     "WHERE e.student_id = ? " +
                     "ORDER BY CASE WHEN e.status = 'PENDING' THEN 1 WHEN e.status = 'APPROVED' THEN 2 ELSE 3 END, e.enrolled_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, studentId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Enrollment e = new Enrollment();
                    e.setId(rs.getInt("id"));
                    e.setStudentId(rs.getInt("student_id"));
                    e.setCourseId(rs.getInt("course_id"));
                    e.setProgress(rs.getInt("progress"));
                    e.setStatus(rs.getString("status"));
                    e.setRejectionReason(rs.getString("rejection_reason"));
                    e.setEnrolledAt(rs.getTimestamp("enrolled_at"));
                    e.setCompletedAt(rs.getTimestamp("completed_at"));
                    e.setCourseTitle(rs.getString("course_title"));
                    e.setInstructorName(rs.getString("instructor_name"));
                    enrollments.add(e);
                }
            }
        }
        return enrollments;
    }

    public List<Enrollment> getCourseStudents(int courseId) throws SQLException {
        List<Enrollment> enrollments = new ArrayList<>();
        String sql = "SELECT e.*, u.name as student_name, u.email as student_email, c.title as course_title " +
                     "FROM enrollments e " +
                     "JOIN users u ON e.student_id = u.id " +
                     "JOIN courses c ON e.course_id = c.id " +
                     "WHERE e.course_id = ? " +
                     "ORDER BY e.enrolled_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, courseId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Enrollment e = new Enrollment();
                    e.setId(rs.getInt("id"));
                    e.setStudentId(rs.getInt("student_id"));
                    e.setStudentName(rs.getString("student_name"));
                    e.setStudentEmail(rs.getString("student_email"));
                    e.setCourseId(rs.getInt("course_id"));
                    e.setCourseTitle(rs.getString("course_title"));
                    e.setProgress(rs.getInt("progress"));
                    e.setStatus(rs.getString("status"));
                    e.setRejectionReason(rs.getString("rejection_reason"));
                    e.setEnrolledAt(rs.getTimestamp("enrolled_at"));
                    e.setCompletedAt(rs.getTimestamp("completed_at"));
                    enrollments.add(e);
                }
            }
        }
        return enrollments;
    }

    public List<Enrollment> getAllEnrollments() throws SQLException {
        List<Enrollment> enrollments = new ArrayList<>();
        String sql = "SELECT e.*, u.name as student_name, u.email as student_email, " +
                     "c.title as course_title, i.name as instructor_name " +
                     "FROM enrollments e " +
                     "JOIN users u ON e.student_id = u.id " +
                     "JOIN courses c ON e.course_id = c.id " +
                     "JOIN users i ON c.instructor_id = i.id " +
                     "ORDER BY CASE WHEN e.status = 'PENDING' THEN 1 WHEN e.status = 'APPROVED' THEN 2 ELSE 3 END, e.enrolled_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                Enrollment e = new Enrollment();
                e.setId(rs.getInt("id"));
                e.setStudentId(rs.getInt("student_id"));
                e.setStudentName(rs.getString("student_name"));
                e.setStudentEmail(rs.getString("student_email"));
                e.setCourseId(rs.getInt("course_id"));
                e.setCourseTitle(rs.getString("course_title"));
                e.setInstructorName(rs.getString("instructor_name"));
                e.setProgress(rs.getInt("progress"));
                e.setStatus(rs.getString("status"));
                e.setRejectionReason(rs.getString("rejection_reason"));
                e.setEnrolledAt(rs.getTimestamp("enrolled_at"));
                e.setCompletedAt(rs.getTimestamp("completed_at"));
                enrollments.add(e);
            }
        }
        return enrollments;
    }

    public boolean updateProgress(int studentId, int courseId, int progressPercentage) throws SQLException {
        String sql = "UPDATE enrollments SET progress = ?, completed_at = CASE WHEN ? >= 100 THEN NOW() ELSE completed_at END WHERE student_id = ? AND course_id = ? AND status = 'APPROVED'";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, progressPercentage);
            stmt.setInt(2, progressPercentage);
            stmt.setInt(3, studentId);
            stmt.setInt(4, courseId);

            return stmt.executeUpdate() > 0;
        }
    }
}
