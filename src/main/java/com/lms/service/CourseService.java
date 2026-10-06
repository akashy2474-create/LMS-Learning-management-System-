package com.lms.service;

import com.lms.dao.CourseDAO;
import com.lms.model.Course;

import java.sql.SQLException;
import java.util.List;

public class CourseService {
    private final CourseDAO courseDAO;

    public CourseService() {
        this.courseDAO = new CourseDAO();
    }

    public CourseService(CourseDAO courseDAO) {
        this.courseDAO = courseDAO;
    }

    public Course createCourse(String title, String description, String syllabus, int instructorId) throws Exception {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Course title is required.");
        }
        if (description == null || description.trim().isEmpty()) {
            throw new IllegalArgumentException("Course description is required.");
        }

        Course course = new Course();
        course.setTitle(title.trim());
        course.setDescription(description.trim());
        course.setSyllabus(syllabus != null ? syllabus.trim() : "");
        course.setInstructorId(instructorId);
        course.setStatus("PENDING");

        boolean created = courseDAO.createCourse(course);
        if (!created) {
            throw new Exception("Failed to create course.");
        }
        return course;
    }

    public boolean updateCourse(int courseId, int userId, String userRole, String title, String description, String syllabus) throws Exception {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Course title is required.");
        }

        Course existing = courseDAO.findCourseById(courseId);
        if (existing == null) {
            throw new IllegalArgumentException("Course not found.");
        }
        if (!"ADMIN".equals(userRole) && existing.getInstructorId() != userId) {
            throw new IllegalArgumentException("You are not authorized to edit this course.");
        }

        return courseDAO.updateCourse(courseId, existing.getInstructorId(), title.trim(), description.trim(), syllabus != null ? syllabus.trim() : "");
    }

    public boolean updateCourse(int courseId, int instructorId, String title, String description, String syllabus) throws Exception {
        return updateCourse(courseId, instructorId, "INSTRUCTOR", title, description, syllabus);
    }

    public boolean deleteCourse(int courseId, int userId, String userRole) throws Exception {
        Course existing = courseDAO.findCourseById(courseId);
        if (existing == null) {
            throw new IllegalArgumentException("Course not found.");
        }
        if (!"ADMIN".equals(userRole) && existing.getInstructorId() != userId) {
            throw new IllegalArgumentException("You are not authorized to delete this course.");
        }

        return courseDAO.deleteCourse(courseId);
    }

    public boolean approveCourse(int courseId) throws SQLException {
        return courseDAO.approveCourse(courseId);
    }

    public boolean rejectCourse(int courseId, String reason) throws SQLException {
        return courseDAO.rejectCourse(courseId, reason);
    }

    public List<Course> getAllCourses() throws SQLException {
        return courseDAO.getAllCourses();
    }

    public List<Course> getApprovedCourses() throws SQLException {
        return courseDAO.getApprovedCourses();
    }

    public List<Course> getCoursesByInstructor(int instructorId) throws SQLException {
        return courseDAO.getCoursesByInstructor(instructorId);
    }

    public Course getCourseById(int id) throws SQLException {
        return courseDAO.findCourseById(id);
    }
}
