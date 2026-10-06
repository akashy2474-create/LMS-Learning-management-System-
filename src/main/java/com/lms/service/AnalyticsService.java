package com.lms.service;

import com.lms.dao.AnalyticsDAO;

import java.sql.SQLException;
import java.util.Map;

public class AnalyticsService {
    private final AnalyticsDAO analyticsDAO = new AnalyticsDAO();

    public Map<String, Integer> getSystemAnalytics() throws SQLException {
        return analyticsDAO.getSystemAnalytics();
    }
}
