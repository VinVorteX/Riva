#!/bin/bash

echo "🚀 Starting RIVA with Face Recognition Integration"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "NextGen-FaceRecognition" ]; then
    echo "❌ Please run this script from the Riva root directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
echo "🔍 Checking ports..."
check_port 3000 || echo "   Frontend may already be running"
check_port 5000 || echo "   Backend may already be running" 
check_port 5001 || echo "   Face recognition service may already be running"

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo "📦 Backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Install frontend dependencies  
echo "📦 Frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Install face recognition dependencies
echo "📦 Face recognition dependencies..."
cd NextGen-FaceRecognition
if [ ! -d "env" ]; then
    python3 -m venv env
fi
source env/bin/activate
pip install flask flask-cors torch torchvision facenet-pytorch opencv-python numpy pillow requests
cd ..

echo ""
echo "🎯 Starting services..."

# Start face recognition service
echo "🔴 Starting Face Recognition Service (Port 5001)..."
cd NextGen-FaceRecognition
source env/bin/activate
python production_integration.py &
FACE_PID=$!
cd ..
sleep 3

# Start backend
echo "🔴 Starting RIVA Backend (Port 5000)..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..
sleep 2

# Start frontend
echo "🔴 Starting RIVA Frontend (Port 3000)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ RIVA with Face Recognition is starting up!"
echo "=================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🤖 Backend: http://localhost:5000"  
echo "👤 Face Recognition: http://localhost:5001"
echo ""
echo "🎯 How to use:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Click the 🎉 button to start inauguration"
echo "3. Face recognition will run for 15 seconds"
echo "4. Recognized dignitaries will be greeted automatically"
echo "5. Then AI speeches will begin"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping all services..."; kill $FACE_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT

# Keep script running
wait