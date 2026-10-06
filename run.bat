@echo off
echo ===================================================
echo   Starting Online Learning Management System (LMS)
echo ===================================================
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting Vite Full-Stack Development Server on Port 3000...
echo Open your browser at: http://localhost:3000
echo.
call npm run dev
pause
