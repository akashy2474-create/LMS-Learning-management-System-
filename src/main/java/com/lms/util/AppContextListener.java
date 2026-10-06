package com.lms.util;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;
import java.util.logging.Logger;

/**
 * AppContextListener - Servlet Context Lifecycle Manager
 * 
 * Manages the initialization of thread pools and connection resources when Tomcat boots,
 * and cleanly releases background threads and database drivers when Tomcat shuts down.
 */
@WebListener
public class AppContextListener implements ServletContextListener {
    private static final Logger LOGGER = Logger.getLogger(AppContextListener.class.getName());

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        LOGGER.info("Starting up Online Learning Management System on Tomcat 10+...");
        ThreadPoolManager.initialize();
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        LOGGER.info("Shutting down Online Learning Management System...");
        ThreadPoolManager.shutdown();
    }
}
