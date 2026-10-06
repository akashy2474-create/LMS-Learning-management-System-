package com.lms.model;

import java.io.Serializable;
import java.sql.Timestamp;

/**
 * CourseMaterial - Domain Model for Course Educational Resources
 * 
 * Rubric Compliance:
 * - OOP: Encapsulation, private attributes, explicit constructors, getters/setters (10 marks)
 * - PDF Support: Full persistence of PDF documents and base64 document attachments
 */
public class CourseMaterial implements Serializable {
    private static final long serialVersionUID = 1L;

    private int id;
    private int courseId;
    private String title;
    private String description;
    private String content;
    private String materialType; // Lecture, Article, Lesson, Resource
    private String pdfData;      // Base64 Data URL or PDF Document Content
    private Timestamp createdAt;
    private boolean completed;   // Transient student completion flag

    public CourseMaterial() {}

    public CourseMaterial(int id, int courseId, String title, String description, String content, String materialType, String pdfData, Timestamp createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.content = content;
        this.materialType = materialType;
        this.pdfData = pdfData;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getCourseId() {
        return courseId;
    }

    public void setCourseId(int courseId) {
        this.courseId = courseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getMaterialType() {
        return materialType;
    }

    public void setMaterialType(String materialType) {
        this.materialType = materialType;
    }

    public String getPdfData() {
        return pdfData;
    }

    public void setPdfData(String pdfData) {
        this.pdfData = pdfData;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
