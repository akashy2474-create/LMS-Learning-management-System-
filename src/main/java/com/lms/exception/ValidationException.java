package com.lms.exception;

import jakarta.servlet.http.HttpServletResponse;

public class ValidationException extends LmsException {
    public ValidationException(String message) {
        super(message, HttpServletResponse.SC_BAD_REQUEST);
    }
}
