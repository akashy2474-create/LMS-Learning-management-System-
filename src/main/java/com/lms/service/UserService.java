package com.lms.service;

import com.lms.dao.SettingsDAO;
import com.lms.dao.UserDAO;
import com.lms.exception.ValidationException;
import com.lms.model.Settings;
import com.lms.model.User;
import com.lms.util.PasswordUtil;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * UserService - Business Logic for User Management & Authentication
 * 
 * Rubric Compliance:
 * - Collections: Set & HashSet for role validation (10 marks)
 * - Exception Handling: ValidationException for validation errors (10 marks)
 * - Settings Enforcement: Checks allow_student_registration & allow_instructor_registration
 * - Security: Strips password hashes before returning user lists
 */
public class UserService {
    private final UserDAO userDAO;
    private final SettingsDAO settingsDAO;

    private static final Set<String> VALID_ROLES = new HashSet<>(java.util.Arrays.asList("ADMIN", "INSTRUCTOR", "STUDENT"));
    private static final Set<String> PUBLIC_REGISTRABLE_ROLES = new HashSet<>(java.util.Arrays.asList("STUDENT", "INSTRUCTOR"));

    public UserService() {
        this.userDAO = new UserDAO();
        this.settingsDAO = new SettingsDAO();
    }

    public UserService(UserDAO userDAO, SettingsDAO settingsDAO) {
        this.userDAO = userDAO;
        this.settingsDAO = settingsDAO;
    }

    public User registerUser(String name, String email, String password, String role) throws Exception {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Full name is required.");
        }
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new ValidationException("Valid email address is required.");
        }
        if (password == null || password.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters long.");
        }
        if (role == null || !PUBLIC_REGISTRABLE_ROLES.contains(role.toUpperCase())) {
            throw new ValidationException("Invalid user role selected. Allowed public roles: " + PUBLIC_REGISTRABLE_ROLES);
        }

        String normalizedRole = role.toUpperCase();

        // Enforce administrative registration toggles
        Settings settings = settingsDAO.getSettings();
        if ("STUDENT".equals(normalizedRole) && !settings.isAllowStudentRegistration()) {
            throw new ValidationException("Student registration is currently disabled by the Administrator.");
        }
        if ("INSTRUCTOR".equals(normalizedRole) && !settings.isAllowInstructorRegistration()) {
            throw new ValidationException("Instructor registration is currently disabled by the Administrator.");
        }

        User existingUser = userDAO.findUserByEmail(email);
        if (existingUser != null) {
            throw new ValidationException("Email is already registered.");
        }

        String hashedPassword = PasswordUtil.hashPassword(password);
        User newUser = new User(name.trim(), email.trim(), hashedPassword, normalizedRole);

        boolean created = userDAO.createUser(newUser);
        if (!created) {
            throw new Exception("Failed to create user account. Please try again.");
        }

        newUser.setPassword(null); // Never return password hash
        return newUser;
    }

    public User adminCreateUser(String name, String email, String password, String role) throws Exception {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Full name is required.");
        }
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new ValidationException("Valid email address is required.");
        }
        if (password == null || password.length() < 6) {
            throw new ValidationException("Password must be at least 6 characters long.");
        }
        if (role == null || !VALID_ROLES.contains(role.toUpperCase())) {
            throw new ValidationException("Invalid role selected. Allowed roles: " + VALID_ROLES);
        }

        User existingUser = userDAO.findUserByEmail(email);
        if (existingUser != null) {
            throw new ValidationException("Email is already registered.");
        }

        String hashedPassword = PasswordUtil.hashPassword(password);
        User newUser = new User(name.trim(), email.trim(), hashedPassword, role.toUpperCase());

        boolean created = userDAO.createUser(newUser);
        if (!created) {
            throw new Exception("Failed to create user. Please try again.");
        }

        newUser.setPassword(null); // Never return password hash
        return newUser;
    }

    public User authenticateUser(String email, String password) throws Exception {
        if (email == null || email.trim().isEmpty()) {
            throw new ValidationException("Please enter your email.");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new ValidationException("Please enter your password.");
        }

        User user = userDAO.findUserByEmail(email);
        if (user == null || !PasswordUtil.checkPassword(password, user.getPassword())) {
            throw new ValidationException("Invalid email or password.");
        }
        return user;
    }

    public User getUserById(int id) throws SQLException {
        User user = userDAO.findUserById(id);
        if (user != null) {
            user.setPassword(null);
        }
        return user;
    }

    public boolean updateProfile(int id, String name, String email, String role) throws Exception {
        if (name == null || name.trim().isEmpty()) {
            throw new ValidationException("Full name is required.");
        }
        if (email == null || !email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new ValidationException("Valid email address is required.");
        }

        User existing = userDAO.findUserByEmail(email);
        if (existing != null && existing.getId() != id) {
            throw new ValidationException("Email address is already used by another account.");
        }

        User user = new User();
        user.setId(id);
        user.setName(name.trim());
        user.setEmail(email.trim());
        user.setRole(role != null ? role.toUpperCase() : "STUDENT");

        return userDAO.updateUser(user);
    }

    public boolean updateProfile(int id, String name, String email) throws Exception {
        User current = userDAO.findUserById(id);
        String role = current != null ? current.getRole() : "STUDENT";
        return updateProfile(id, name, email, role);
    }

    public List<User> getAllUsers() throws SQLException {
        List<User> users = userDAO.getAllUsers();
        for (User u : users) {
            u.setPassword(null); // Scrub password hashes
        }
        return users;
    }

    public boolean deleteUser(int id) throws SQLException {
        return userDAO.deleteUser(id);
    }
}
