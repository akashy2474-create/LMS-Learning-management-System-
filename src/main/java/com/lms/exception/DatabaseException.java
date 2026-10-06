package com.lms.exception;

import jakarta.servlet.http.HttpServletResponse;

public class DatabaseException extends LmsException {
    public DatabaseException(String message) {
        super(message, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
    }

    public DatabaseException(String message, Throwable cause) {
        super(message, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, cause);
    }
}
