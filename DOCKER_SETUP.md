# 🐳 RIVA Docker Setup

Complete Docker setup for RIVA AI Voice Assistant with multi-service architecture.

## 🚀 Quick Start (2 commands)

```bash
# 1. Setup environment
make setup

# 2. Start RIVA
make up
```

Open browser: **http://localhost:3000**

## 📋 Prerequisites

- Docker & Docker Compose
- Make (optional, for easy commands)

## ⚡ Setup Commands

### Production Mode
```bash
# Build and start all services
make build && make up

# Or manually:
docker-compose up -d --build
```

### Development Mode (Hot Reload)
```bash
# Start with hot reload
make dev

# Or manually:
docker-compose -f docker-compose.dev.yml up -d --build
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Face Recognition│
│   React + Nginx │◄──►│  Node.js + API  │◄──►│   Python + CV   │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Setup
```bash
# Copy and edit backend environment
cp backend/.env.example backend/.env

# Add your API keys:
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Face Recognition Setup
```bash
# Add face images for recognition
mkdir -p Face-Recognition-using-Facenet/enroll_images/YourName
# Add 5-10 photos of your face in that folder

# Enroll faces (after containers are running)
docker-compose exec face-recognition python enrollment_lite.py
```

## 📝 Available Commands

```bash
make help          # Show all commands
make setup         # Initial setup
make build         # Build images
make up            # Start production
make dev           # Start development
make down          # Stop services
make logs          # Show all logs
make clean         # Clean up everything
make restart       # Restart services
make status        # Show service status
```

## 🔍 Service Details

### Frontend (React + Nginx)
- **Port**: 3000
- **Features**: 3D AudioSphere, Voice UI, Avatar Ring
- **Hot Reload**: Available in dev mode
- **Nginx**: Serves static files + API proxy

### Backend (Node.js + Express)
- **Port**: 5000
- **Features**: Gemini AI, Voice processing, Face recognition API
- **Hot Reload**: Nodemon in dev mode
- **Health Check**: `/health` endpoint

### Face Recognition (Python + OpenCV)
- **Port**: 8000
- **Features**: Face enrollment, Recognition API
- **Models**: FaceNet lite for low-spec machines
- **Storage**: Persistent face database

## 🗂️ Volumes & Data

```bash
# Persistent data volumes
face_db/              # Face recognition database
backend/uploads/      # File uploads
enroll_images/        # Face enrollment photos
```

## 🐛 Troubleshooting

### Services won't start
```bash
# Check logs
make logs

# Check specific service
make logs-backend
make logs-frontend
make logs-face
```

### Port conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :5000
lsof -i :8000

# Stop conflicting services
sudo kill -9 $(lsof -t -i:3000)
```

### Face recognition not working
```bash
# Check face database
docker-compose exec face-recognition ls -la face_db/

# Re-enroll faces
docker-compose exec face-recognition python enrollment_lite.py
```

### API keys not working
```bash
# Check environment variables
docker-compose exec backend env | grep API

# Restart after env changes
make restart
```

## 🔄 Development Workflow

### Code Changes
```bash
# Start dev mode (hot reload enabled)
make dev

# Make changes to code
# Frontend: Changes auto-reload
# Backend: Nodemon restarts server
```

### Adding Dependencies
```bash
# Backend dependencies
docker-compose exec backend-dev npm install package-name

# Frontend dependencies  
docker-compose exec frontend-dev npm install package-name

# Rebuild images after package.json changes
make build
```

### Database Reset
```bash
# Clear face database
docker-compose down -v
make up

# Re-enroll faces
docker-compose exec face-recognition python enrollment_lite.py
```

## 📊 Monitoring

### Service Health
```bash
# Check all services
make status

# Individual health checks
curl http://localhost:5000/health    # Backend
curl http://localhost:3000           # Frontend
curl http://localhost:8000/health    # Face Recognition
```

### Resource Usage
```bash
# Docker stats
docker stats

# Service-specific stats
docker stats riva_backend_1 riva_frontend_1 riva_face-recognition_1
```

## 🚀 Production Deployment

### Build for Production
```bash
# Build optimized images
docker-compose build --no-cache

# Start production services
make up
```

### Environment Variables
```bash
# Production backend/.env
NODE_ENV=production
GEMINI_API_KEY=your_production_key
USE_ELEVENLABS=true
USE_WHISPER=true
```

## 🔒 Security Notes

- API keys are loaded from `.env` files (not committed to git)
- Face database is stored in Docker volumes
- Nginx serves frontend with security headers
- Health checks ensure service availability

## 📁 Docker Files Structure

```
Riva/
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
├── Dockerfile                  # Multi-stage builds
├── .dockerignore              # Exclude files
├── Makefile                   # Easy commands
└── DOCKER_SETUP.md           # This file
```

## 💡 Tips

- Use `make dev` for development (hot reload)
- Use `make up` for production (optimized builds)
- Check `make logs` if something breaks
- Face recognition needs good lighting
- First TTS requires user interaction (browser security)

---

**🎤 RIVA - Dockerized and Ready!**

Built for NextGen Supercomputing Club, KIET