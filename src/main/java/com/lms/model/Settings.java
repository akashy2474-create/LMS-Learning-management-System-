package com.lms.model;

import java.io.Serializable;
import java.sql.Timestamp;

public class Settings implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id = 1;
    private String platformName;
    private String platformEmail;
    private boolean allowStudentRegistration;
    private boolean allowInstructorRegistration;
    private Timestamp updatedAt;

    public Settings() {}

    public Settings(int id, String platformName, String platformEmail, boolean allowStudentRegistration, boolean allowInstructorRegistration, Timestamp updatedAt) {
        this.id = id;
        this.platformName = platformName;
        this.platformEmail = platformEmail;
        this.allowStudentRegistration = allowStudentRegistration;
        this.allowInstructorRegistration = allowInstructorRegistration;
        this.updatedAt = updatedAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getPlatformName() {
        return platformName;
    }

    public void setPlatformName(String platformName) {
        this.platformName = platformName;
    }

    public String getPlatformEmail() {
        return platformEmail;
    }

    public void setPlatformEmail(String platformEmail) {
        this.platformEmail = platformEmail;
    }

    public boolean isAllowStudentRegistration() {
        return allowStudentRegistration;
    }

    public void setAllowStudentRegistration(boolean allowStudentRegistration) {
        this.allowStudentRegistration = allowStudentRegistration;
    }

    public boolean isAllowInstructorRegistration() {
        return allowInstructorRegistration;
    }

    public void setAllowInstructorRegistration(boolean allowInstructorRegistration) {
        this.allowInstructorRegistration = allowInstructorRegistration;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }
}
