@echo off
echo ===================================================
echo   Building Java Backend WAR File (Jakarta Servlets)
echo ===================================================
echo.
echo Running Maven Clean Package...
call mvn clean package
echo.
if exist target\lms-api.war (
    echo [SUCCESS] target\lms-api.war created successfully!
    echo Copy target\lms-api.war to your Apache Tomcat webapps\ directory.
) else (
    echo [ERROR] Build failed. Please ensure JDK 17+ and Maven are installed.
)
echo.
pause
