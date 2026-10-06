package com.lms.exception;

/**
 * Base application exception for LMS with HTTP status code mapping.
 */
public class LmsException extends RuntimeException {
    private final int statusCode;

    public LmsException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public LmsException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
