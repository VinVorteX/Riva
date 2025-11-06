# 🎤 RIVA - AI Voice Assistant

**RIVA** is an intelligent voice-powered AI assistant built for the **NextGen Supercomputing Club** at KIET Group of Institutions. It combines cutting-edge AI technology with an immersive 3D audio visualization experience.

## ✨ Features

- 🎙️ **Continuous Voice Recognition** - Hands-free conversation mode with automatic feedback loop prevention
- 🤖 **Gemini 2.0 Flash AI** - Powered by Google's latest AI model for intelligent responses
- 🎨 **3D AudioSphere Visualization** - Real-time animated sphere that reacts to voice
- 🗣️ **Browser TTS (en-IN)** - Natural Indian English voice output
- 💬 **Dual Panel UI** - Split view showing AI and user messages separately
- 📚 **Club Knowledge Base** - Expert on NextGen Supercomputing Club information
- 🎯 **Smart Response Mode** - Detailed introductions, crisp answers for everything else

## 🚀 Tech Stack

### Backend
- **Node.js + Express** - REST API server
- **Google Gemini 2.0 Flash** - AI chat responses
- **OpenAI Whisper** (optional) - Speech-to-text
- **ElevenLabs** (optional) - Voice cloning TTS

### Frontend
- **React** - UI framework
- **Three.js** - 3D AudioSphere visualization
- **Web Speech API** - Browser-based STT/TTS
- **React Markdown** - Message formatting

## 📦 Installation

### 🪟 Windows Quick Start (Recommended)

**Prerequisites:**
- Node.js 16+ → https://nodejs.org/
- Git with Git LFS → https://git-lfs.github.com/

**Quick Setup:**
```cmd
# Clone repository
git clone https://github.com/VinVorteX/Riva.git
cd Riva

# Run automatic setup
WINDOWS_QUICK_START.bat

# Add API key in: Riva-2\Riva-main\backend\.env
# GEMINI_API_KEY=your_key_here

# Start application
START_RIVA.bat
```

Open browser: **http://localhost:3000**

📖 **Full Windows Guide:** [WINDOWS_README.txt](WINDOWS_README.txt)

---

### 🐧 Linux/Mac Setup

**Prerequisites:**
- Node.js 16+
- Git with Git LFS
- npm or yarn

**Quick Setup:**
```bash
# Clone repository
git clone https://github.com/VinVorteX/Riva.git
cd Riva

# Install Git LFS (if not installed)
sudo dnf install git-lfs  # Fedora
sudo apt install git-lfs  # Ubuntu
brew install git-lfs      # macOS

# Setup Git LFS
./setup-git-lfs.sh
```

---

### 🐳 Docker Setup

**Quick Start:**
```bash
# Clone and setup
git clone https://github.com/VinVorteX/Riva.git
cd Riva

# Setup environment
make setup
# Edit backend/.env with your API keys

# Start RIVA
make up
```

**Docker Commands:**
```bash
make help     # Show all commands
make build    # Build images
make logs     # Show logs
make down     # Stop services
make clean    # Clean everything
```

📖 **Full Docker Guide:** [DOCKER_SETUP.md](DOCKER_SETUP.md)

---

### 🛠️ Manual Setup

**Prerequisites:**
- Node.js 16+
- npm or yarn
- Git LFS (for video files)
- Python 3.8+ (for face recognition)

### Backend Setup (Riva-2)

```bash
cd Riva-2/Riva-main/backend
npm install
```

Create `.env` file:
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5001
```

Start backend:
```bash
node server.js
```

### Frontend Setup (Riva-2)

```bash
cd Riva-2/Riva-main/frontend
npm install
npm start
```

### Video Files (Git LFS)

Large video files are stored using Git LFS:
- `sphere-animation.mp4` (158 MB)
- `trial.mp4` (86 MB)
- `background_3.mp4` (69 MB)
- And more...

They will automatically download when you clone the repository if Git LFS is installed.

## 🎯 Usage

1. **Start Backend** - Run `node server.js` in backend folder
2. **Start Frontend** - Run `npm start` in frontend folder
3. **Open Browser** - Navigate to `http://localhost:3000`
4. **Click Continuous Mode** - Enable hands-free conversation
5. **Start Speaking** - RIVA will listen, respond, and speak back

### Special Commands

- **"Are you ready to take over?"** - Triggers full inauguration speech
- **"Tell me about the club"** - Detailed club introduction
- **General questions** - Short, crisp 2-4 sentence answers

## 🎨 Features Breakdown

### Continuous Mode
- Automatic voice detection
- AI speech detection prevention (no feedback loop)
- 2-second cooldown after AI finishes speaking
- Smart input filtering

### AudioSphere
- Real-time audio level visualization
- Vertex displacement based on voice amplitude
- Smooth scale transitions
- Idle breathing animation
- Glow intensity changes

### Response Intelligence
- **Club Introduction**: Detailed, comprehensive answers
- **Other Questions**: Concise 2-4 sentence responses
- **Context Awareness**: Maintains conversation history
- **Fallback Handling**: Graceful error recovery

## 🏗️ Project Structure

```
Riva/
├── Riva-2/                         # Main Application
│   └── Riva-main/
│       ├── backend/                # Backend Server (Port 5001)
│       │   ├── server.js          # Gemini 2.5 Flash API
│       │   └── .env               # API keys
│       └── frontend/               # React Frontend (Port 3000)
│           ├── src/
│           │   ├── App.js         # Main app
│           │   └── components/
│           │       ├── Showcase.jsx       # Inauguration ceremony
│           │       ├── FaceCard.jsx       # Speaker cards
│           │       ├── RivaChatbot.jsx    # Q&A chatbot
│           │       └── AudioSphere.js     # Video visualization
│           └── public/
│               └── *.mp4          # Video files (Git LFS)
├── NextGen-FaceRecognition/        # Face recognition system
│   ├── enrollment_lite.py         # Face enrollment
│   └── dataset/                   # Face photos
├── WINDOWS_QUICK_START.bat         # Windows setup script
├── START_RIVA.bat                  # Windows start script
├── WINDOWS_README.txt              # Windows guide
├── setup-git-lfs.sh                # Linux/Mac Git LFS setup
├── setup-git-lfs.bat               # Windows Git LFS setup
└── README.md                       # This file
```

## 🔧 Configuration

### Backend Settings (Riva-2/Riva-main/backend/.env)
```env
GEMINI_API_KEY=your_key_here
PORT=5001
```

### Frontend Features
- **Inauguration Mode**: 4 speaker ceremony with face recognition
- **Q&A Chatbot**: Continuous listening with AudioSphere
- **Voice**: Female voice (en-IN) with pitch 1.1-1.2
- **Auto-transition**: Ceremony → Chatbot after speeches

### Git LFS Configuration
- Storage: 1 GB free tier
- Bandwidth: 1 GB/month
- Tracked files: `*.mp4` (except intro.mp4, rotate.mp4)
- Total video size: ~372 MB

## 🎓 About NextGen Supercomputing Club

RIVA is the official AI assistant for the NextGen Supercomputing Club at KIET Group of Institutions. The club focuses on:

- High-Performance Computing (HPC)
- Artificial Intelligence & Machine Learning
- Quantum Computing & Simulation
- GPU Programming & Optimization

**Tagline**: "Building Production Brains"

## 👥 Team

### Core Members
- **President**: Shreya Jain
- **Vice President**: Samarth Shukla
- **PR Head**: Ujjawal Tyagi
- **Graphics Head**: Preeti Singh
- **Event Management**: Srashti Gupta & Vidisha Goel
- **Technical Leads**: Ronak Goel & Vinayak Rastogi
- **Treasurer**: Divyansh Verma

### Mentors
- Dr. Gaurav Srivastava
- Dr. Richa Singh
- Dr. Bikki Kumar

### Leadership
- **HOD**: Dr. Rekha Kashyap
- **Director**: Dr. Manoj Goel
- **Director Academics**: Dr. Adesh Kumar Pandey

## 🐛 Known Issues

- Browser TTS may require user interaction to unlock (first button click)
- Continuous mode may pick up background noise
- AudioSphere performance depends on GPU capabilities

## 🔮 Future Enhancements

- [ ] Multi-language support
- [ ] Voice cloning integration
- [ ] Mobile responsive design
- [ ] Conversation export
- [ ] Custom wake word detection

## 📄 License

This project is developed for the NextGen Supercomputing Club at KIET Group of Institutions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

**Built with ❤️ by the NextGen Supercomputing Club**

*Where Intelligence Meets Innovation*
