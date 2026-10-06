package com.lms.exception;

import jakarta.servlet.http.HttpServletResponse;

public class AuthenticationException extends LmsException {
    public AuthenticationException(String message) {
        super(message, HttpServletResponse.SC_UNAUTHORIZED);
    }
}
