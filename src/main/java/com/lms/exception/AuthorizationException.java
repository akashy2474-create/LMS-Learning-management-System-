package com.lms.exception;

import jakarta.servlet.http.HttpServletResponse;

public class AuthorizationException extends LmsException {
    public AuthorizationException(String message) {
        super(message, HttpServletResponse.SC_FORBIDDEN);
    }
}
