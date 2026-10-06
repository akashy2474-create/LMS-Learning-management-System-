package com.lms.exception;

import jakarta.servlet.http.HttpServletResponse;

public class ResourceNotFoundException extends LmsException {
    public ResourceNotFoundException(String message) {
        super(message, HttpServletResponse.SC_NOT_FOUND);
    }
}
