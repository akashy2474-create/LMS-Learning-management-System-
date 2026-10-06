@echo off
echo ===================================================
echo   Importing LMS Database Schema into MySQL 8.0
echo ===================================================
echo.
echo Enter your MySQL root password when prompted:
mysql -u root -p < database\schema.sql
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] MySQL database lms_db initialized successfully with seed tables!
) else (
    echo [ERROR] Failed to import schema. Please verify MySQL server is running.
)
echo.
pause
