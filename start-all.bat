@echo off
echo 🚀 Starting all RIVA services...

REM Check if we're in the right directory
if not exist "Riva-2" (
    echo ❌ Please run this script from the Riva root directory
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Please run this script from the Riva root directory  
    pause
    exit /b 1
)

echo 🛑 Stopping existing services...
taskkill /f /im node.exe >nul 2>&1

echo 📦 Installing dependencies...

REM Install Riva-2 backend dependencies
echo 📦 Riva-2 Backend dependencies...
cd Riva-2\Riva-main\backend
if not exist "node_modules" (
    call npm install
)
cd ..\..\..

REM Install Riva-main backend dependencies  
echo 📦 Riva-main Backend dependencies...
cd backend
if not exist "node_modules" (
    call npm install
)
cd ..

REM Install Riva-2 frontend dependencies
echo 📦 Riva-2 Frontend dependencies...
cd Riva-2\Riva-main\frontend
if not exist "node_modules" (
    call npm install
)
cd ..\..\..

REM Install Riva-main frontend dependencies
echo 📦 Riva-main Frontend dependencies...
cd frontend
if not exist "node_modules" (
    call npm install
)
cd ..

echo 🎯 Starting services...

REM Start Riva-2 Backend (Port 5001)
echo 🔴 Starting Riva-2 Backend (Port 5001)...
cd Riva-2\Riva-main\backend
start "Riva-2 Backend" cmd /k "node server.js"
cd ..\..\..
timeout /t 2 /nobreak >nul

REM Start Riva-main Backend (Port 5000)  
echo 🔴 Starting Riva-main Backend (Port 5000)...
cd backend
start "Riva-main Backend" cmd /k "node server.js"
cd ..
timeout /t 2 /nobreak >nul

REM Start Riva-2 Frontend (Port 3000)
echo 🔴 Starting Riva-2 Frontend (Port 3000)...
cd Riva-2\Riva-main\frontend
start "Riva-2 Frontend" cmd /k "npm start"
cd ..\..\..
timeout /t 3 /nobreak >nul

REM Start Riva-main Frontend (Port 3001)
echo 🔴 Starting Riva-main Frontend (Port 3001)...
cd frontend
start "Riva-main Frontend" cmd /k "set PORT=3001 && npm start"
cd ..

echo.
echo ✅ All services started!
echo ==================================================
echo 🌐 Access URLs:
echo    Riva-2 (Inauguration): http://localhost:3000
echo    Riva-main (Chatbot):   http://localhost:3001
echo.
echo 🎯 How to use:
echo 1. Open http://localhost:3000 in your browser
echo 2. Face recognition will run for 15 seconds
echo 3. Recognized dignitaries will be greeted automatically  
echo 4. Then inauguration ceremony will start automatically
echo 5. After ceremony, Q&A chatbot will be available
echo.
echo 📝 To stop services: Close all opened command windows
echo ==================================================

pause