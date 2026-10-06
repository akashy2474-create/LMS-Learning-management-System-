package com.lms.service;

import com.lms.dao.CourseDAO;
import com.lms.dao.EnrollmentDAO;
import com.lms.exception.ValidationException;
import com.lms.model.Course;
import com.lms.model.Enrollment;

import java.sql.SQLException;
import java.util.List;

/**
 * EnrollmentService - Business Logic for Course Enrollments
 */
public class EnrollmentService {
    private final EnrollmentDAO enrollmentDAO = new EnrollmentDAO();
    private final CourseDAO courseDAO = new CourseDAO();

    public boolean enrollStudent(int studentId, int courseId) throws Exception {
        Course course = courseDAO.findCourseById(courseId);
        if (course == null) {
            throw new ValidationException("Course does not exist.");
        }
        if (!"APPROVED".equals(course.getStatus())) {
            throw new ValidationException("Only approved courses can be enrolled in.");
        }

        if (enrollmentDAO.isEnrolled(studentId, courseId)) {
            String currentStatus = enrollmentDAO.getEnrollmentStatus(studentId, courseId);
            if ("PENDING".equals(currentStatus)) {
                throw new ValidationException("Your enrollment request is already pending Administrator approval.");
            }
            if ("APPROVED".equals(currentStatus)) {
                throw new ValidationException("You are already enrolled in this course.");
            }
        }

        // New student enrollment is set to PENDING awaiting Admin approval
        return enrollmentDAO.createEnrollment(studentId, courseId);
    }

    public boolean approveEnrollment(int enrollmentId, int adminUserId) throws SQLException {
        return enrollmentDAO.approveEnrollmentTransaction(enrollmentId, adminUserId);
    }

    public boolean rejectEnrollment(int enrollmentId, String reason, int adminUserId) throws SQLException {
        return enrollmentDAO.rejectEnrollmentTransaction(enrollmentId, reason, adminUserId);
    }

    public boolean unenrollStudent(int studentId, int courseId) throws SQLException {
        return enrollmentDAO.unenrollTransaction(studentId, courseId);
    }

    public List<Enrollment> getAllEnrollments() throws SQLException {
        return enrollmentDAO.getAllEnrollments();
    }

    public List<Enrollment> getStudentEnrollments(int studentId) throws SQLException {
        return enrollmentDAO.getStudentEnrollments(studentId);
    }

    public List<Enrollment> getCourseStudents(int courseId) throws SQLException {
        return enrollmentDAO.getCourseStudents(courseId);
    }

    public String getEnrollmentStatus(int studentId, int courseId) throws SQLException {
        return enrollmentDAO.getEnrollmentStatus(studentId, courseId);
    }
}
