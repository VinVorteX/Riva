#!/bin/bash

echo "🚀 Starting all RIVA services..."

# Kill existing processes
echo "🛑 Stopping existing services..."
lsof -ti:5000,5001,3000,3001 | xargs kill -9 2>/dev/null

# Start Riva-2 Backend (Port 5001)
echo "📡 Starting Riva-2 Backend on port 5001..."
cd /home/berzerk8/Riva/Riva-2/Riva-main/backend
npm start > /tmp/riva2-backend.log 2>&1 &
sleep 2

# Start Riva-main Backend (Port 5000)
echo "📡 Starting Riva-main Backend on port 5000..."
cd /home/berzerk8/Riva/Riva-main/Riva-main/backend
npm start > /tmp/riva-main-backend.log 2>&1 &
sleep 2

# Start Riva-2 Frontend (Port 3000)
echo "🌐 Starting Riva-2 Frontend on port 3000..."
cd /home/berzerk8/Riva/Riva-2/Riva-main/frontend
BROWSER=none npm start > /tmp/riva2-frontend.log 2>&1 &
sleep 3

# Start Riva-main Frontend (Port 3001)
echo "🌐 Starting Riva-main Frontend on port 3001..."
cd /home/berzerk8/Riva/Riva-main/Riva-main/frontend
PORT=3001 BROWSER=none npm start > /tmp/riva-main-frontend.log 2>&1 &
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Service Status:"
lsof -i:5000,5001,3000,3001 | grep LISTEN
echo ""
echo "🌐 Access URLs:"
echo "   Riva-2 (Inauguration): http://localhost:3000"
echo "   Riva-main (Chatbot):   http://localhost:3001"
echo ""
echo "📝 Logs:"
echo "   Riva-2 Backend:   tail -f /tmp/riva2-backend.log"
echo "   Riva-main Backend: tail -f /tmp/riva-main-backend.log"
echo "   Riva-2 Frontend:  tail -f /tmp/riva2-frontend.log"
echo "   Riva-main Frontend: tail -f /tmp/riva-main-frontend.log"
echo ""
