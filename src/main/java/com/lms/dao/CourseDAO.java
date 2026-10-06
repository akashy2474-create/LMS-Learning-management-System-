package com.lms.dao;

import com.lms.model.Course;
import com.lms.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CourseDAO {

    public boolean createCourse(Course course) throws SQLException {
        String sql = "INSERT INTO courses (title, description, syllabus, instructor_id, status) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setString(1, course.getTitle());
            stmt.setString(2, course.getDescription());
            stmt.setString(3, course.getSyllabus());
            stmt.setInt(4, course.getInstructorId());
            stmt.setString(5, "PENDING"); // Always PENDING initially

            int affectedRows = stmt.executeUpdate();
            if (affectedRows > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        course.setId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public boolean updateCourse(int courseId, int instructorId, String title, String description, String syllabus) throws SQLException {
        String sql = "UPDATE courses SET title = ?, description = ?, syllabus = ? WHERE id = ? AND instructor_id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, title);
            stmt.setString(2, description);
            stmt.setString(3, syllabus);
            stmt.setInt(4, courseId);
            stmt.setInt(5, instructorId);

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deleteCourse(int courseId) throws SQLException {
        String sql = "DELETE FROM courses WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, courseId);
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean approveCourse(int courseId) throws SQLException {
        String sql = "UPDATE courses SET status = 'APPROVED', rejection_reason = NULL WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, courseId);
            return stmt.executeUpdate() > 0;
        }
    }

    public boolean rejectCourse(int courseId, String rejectionReason) throws SQLException {
        String sql = "UPDATE courses SET status = 'REJECTED', rejection_reason = ? WHERE id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, rejectionReason != null ? rejectionReason.trim() : "Does not meet guidelines");
            stmt.setInt(2, courseId);
            return stmt.executeUpdate() > 0;
        }
    }

    public List<Course> getAllCourses() throws SQLException {
        List<Course> courses = new ArrayList<>();
        String sql = "SELECT c.*, u.name as instructor_name, " +
                     "(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count " +
                     "FROM courses c " +
                     "JOIN users u ON c.instructor_id = u.id " +
                     "ORDER BY c.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                course.setInstructorName(rs.getString("instructor_name"));
                course.setStudentCount(rs.getInt("student_count"));
                courses.add(course);
            }
        }
        return courses;
    }

    public List<Course> getApprovedCourses() throws SQLException {
        List<Course> courses = new ArrayList<>();
        String sql = "SELECT c.*, u.name as instructor_name, " +
                     "(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count " +
                     "FROM courses c " +
                     "JOIN users u ON c.instructor_id = u.id " +
                     "WHERE c.status = 'APPROVED' " +
                     "ORDER BY c.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            
            while (rs.next()) {
                Course course = mapResultSetToCourse(rs);
                course.setInstructorName(rs.getString("instructor_name"));
                course.setStudentCount(rs.getInt("student_count"));
                courses.add(course);
            }
        }
        return courses;
    }

    public List<Course> getCoursesByInstructor(int instructorId) throws SQLException {
        List<Course> courses = new ArrayList<>();
        String sql = "SELECT c.*, u.name as instructor_name, " +
                     "(SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) as student_count " +
                     "FROM courses c " +
                     "JOIN users u ON c.instructor_id = u.id " +
                     "WHERE c.instructor_id = ? " +
                     "ORDER BY c.created_at DESC";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, instructorId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Course course = mapResultSetToCourse(rs);
                    course.setInstructorName(rs.getString("instructor_name"));
                    course.setStudentCount(rs.getInt("student_count"));
                    courses.add(course);
                }
            }
        }
        return courses;
    }

    public Course findCourseById(int id) throws SQLException {
        String sql = "SELECT c.*, u.name as instructor_name FROM courses c JOIN users u ON c.instructor_id = u.id WHERE c.id = ?";
        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Course c = mapResultSetToCourse(rs);
                    c.setInstructorName(rs.getString("instructor_name"));
                    return c;
                }
            }
        }
        return null;
    }

    private Course mapResultSetToCourse(ResultSet rs) throws SQLException {
        Course course = new Course();
        course.setId(rs.getInt("id"));
        course.setTitle(rs.getString("title"));
        course.setDescription(rs.getString("description"));
        course.setSyllabus(rs.getString("syllabus"));
        course.setInstructorId(rs.getInt("instructor_id"));
        course.setStatus(rs.getString("status"));
        try {
            course.setRejectionReason(rs.getString("rejection_reason"));
        } catch (SQLException ignored) {}
        course.setCreatedAt(rs.getTimestamp("created_at"));
        course.setUpdatedAt(rs.getTimestamp("updated_at"));
        return course;
    }
}
