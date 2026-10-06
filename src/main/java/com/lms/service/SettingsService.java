package com.lms.service;

import com.lms.dao.SettingsDAO;
import com.lms.model.Settings;

import java.sql.SQLException;

public class SettingsService {
    private final SettingsDAO settingsDAO = new SettingsDAO();

    public Settings getSettings() throws SQLException {
        return settingsDAO.getSettings();
    }

    public boolean updateSettings(String platformName, String platformEmail, boolean allowStudentReg, boolean allowInstructorReg) throws Exception {
        if (platformName == null || platformName.trim().isEmpty()) {
            throw new IllegalArgumentException("Platform name is required.");
        }
        if (platformEmail == null || !platformEmail.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
            throw new IllegalArgumentException("Valid platform email is required.");
        }

        Settings s = new Settings();
        s.setPlatformName(platformName.trim());
        s.setPlatformEmail(platformEmail.trim());
        s.setAllowStudentRegistration(allowStudentReg);
        s.setAllowInstructorRegistration(allowInstructorReg);

        return settingsDAO.updateSettings(s);
    }
}
