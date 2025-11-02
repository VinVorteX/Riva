// server.js - RIVA: General Purpose AI + Club Expert
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const multer = require('multer');
const { spawn } = require('child_process');
require('dotenv').config();

const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const USE_WHISPER = process.env.USE_WHISPER === 'true';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_MODEL_ID = 'eleven_turbo_v2';
const USE_ELEVENLABS = process.env.USE_ELEVENLABS === 'true' && ELEVENLABS_API_KEY;

console.log('🔑 Gemini API Key loaded:', process.env.GEMINI_API_KEY ? '✅' : '❌');
console.log('🔑 OpenAI API Key loaded:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('🔑 ElevenLabs API Key loaded:', ELEVENLABS_API_KEY ? '✅' : '❌');
console.log('🎙️ ElevenLabs Voice ID:', ELEVENLABS_VOICE_ID);
console.log('🎤 STT: ' + (USE_WHISPER ? 'OpenAI Whisper' : 'Browser Speech API'));

let conversationHistory = [];

// ===============================================
// 🎓 COMPLETE KNOWLEDGE BASE - ALL QUESTIONS & ANSWERS
// ===============================================
const CLUB_KNOWLEDGE = `
# 🧠 NextGen Supercomputing Club - Complete Knowledge Base

## 💫 Club Introduction
Welcome to the NextGen Supercomputing Club — a forward-thinking community at the forefront of High-Performance Computing (HPC), Artificial Intelligence (AI), and Quantum Computing innovation.

Our mission is to build production-ready Machine Learning engineers through hands-on experience, collaboration, and cutting-edge computational projects.

We aim to bridge the gap between academic learning and real-world AI applications, empowering students to solve industry-level challenges using advanced computing technologies.

Join us to explore GPU clusters, exascale computing, AI-driven simulations, and quantum research — and be part of the next generation of computational innovators.

## 🏷 Tagline
"Building Production Brains"

## 💡 Motto
To create production-ready ML engineers who can design, deploy, and scale real-world AI solutions.

## 🧩 About Us
- **Founded**: 2025
- **Vision**: To build a community of industry-ready innovators who can translate theoretical knowledge into real-world AI and HPC solutions. Our vision is to enable students to leverage supercomputing capabilities—like the NVIDIA DGX A100—to work on production-scale projects, drive innovation, and make a tangible impact in the tech industry.
- **Mission**: To empower students to become production-ready Machine Learning engineers through hands-on learning, real-world problem solving, and exposure to cutting-edge technologies such as High-Performance Computing (HPC), Artificial Intelligence (AI), and Quantum Computing. We aim to bridge the gap between academic knowledge and industry practices by organizing bootcamps, hackathons, workshops, and collaborative research projects.

## Focus Areas
- High-Performance Computing (HPC)
- Artificial Intelligence and Machine Learning
- Quantum Simulation and Computing
- GPU and Parallel Programming
- Cloud HPC and AI Deployment
- Model Optimization and Scalability

## Resources
- **Hardware**: NVIDIA DGX A100 Supercomputer – enabling large-scale AI training and scientific simulations
- **Software Stack**: CUDA, MPI, PyTorch, TensorFlow, OpenMPI, and other open-source HPC tools
- **Infrastructure**: Cloud HPC platforms for experimentation and learning

## 🎯 Objectives
1. Cultivate a generation of industry-ready ML engineers
2. Offer hands-on training through bootcamps, hackathons, workshops, and an annual AI Summit
3. Encourage students to develop and deploy real-world AI and HPC projects
4. Foster partnerships with research labs, industry leaders, and academic mentors
5. Promote open-source collaboration and computational research on campus

## ⚙ What We Do
The NextGen Supercomputing Club organizes diverse activities that merge learning with innovation:

- 💻 **Workshops & Bootcamps**: Focused on Python for HPC, Deep Learning, Quantum Computing, and Parallel Programming using CUDA and MPI
- ⚡ **Hackathons**: Problem-solving competitions centered around AI, HPC, and data-driven innovation
- 🧠 **NextGen AI Summit (Annual Flagship Event)**: A high-impact event featuring industry speakers, live demos, and project showcases
- 🚀 **Project Incubation**: Members can propose and develop projects under guidance when needed, using real hardware and industry frameworks
- 🎓 **Skill Development Series**: Short, practical learning sessions to upskill members in AI, HPC, and cloud deployment
- 🤝 **Collaborations**: Partnerships with startups, universities, and NVIDIA's academic programs for research and technical exposure

## 👥 Members & Team Structure
- **President** – Shreya Jain: Leads the club's direction and strategic initiatives
- **Vice President** – Samarth Shukla: Oversees operations, collaborations, and event execution
- **PR Head** – Ujjawal Tyagi: Manages public relations, outreach, and communication
- **Graphics Head** – Preeti Singh: Designs creative visuals, posters, and media content
- **Event Management Leads** – Srashti Gupta & Vidisha Goel: Handle logistics, coordination, and event planning
- **Technical Leads** – Ronak Goel & Vinayak Rastogi: Guide members through technical projects, workshops, and infrastructure setup
- **Treasurer** – Divyansh Verma: Manages finances, budgeting, and sponsorships

## 👨‍🏫 MENTORS & LEADERSHIP

### Club Mentors (3 Expert Faculty)
**Dr. Gaurav Srivastav**: AI researcher, educator, and author with 12+ years of experience. Assistant Professor at KIET Ghaziabad. Ph.D. from Sharda University (2024). Published 20+ research papers. Expertise: Generative AI, BERT-enabled learning models, data-driven educational systems.

**Dr. Richa Singh**: Assistant Professor (Research) in CSE Department at KIET, specializing in AI/ML and Data Science. Ph.D. in IT from Amity University, Lucknow. Awards: Young Research Award, Young Dronacharya Award. Infosys-certified faculty, keynote speaker, and jury member at NIFT.

**Dr. Bikki Kumar**: AI and Data Science professional at Drifko. M.Tech in Data Science from DTU, B.Tech in IT from NIT Srinagar. Expertise: LLMs, RAG systems, and workflow optimization.

### Department & College Leadership
**Dr. Rekha Kashyap**: Dean & Head of AI/ML Department. 30 years of experience. Ph.D. from JNU. Former Professor & Dean at NIET. Member of IEEE, CSI, ACM, ISTE, IAENG.

**Dr. Manoj Goel**: Executive Director of KIET. Provides visionary leadership to the entire institution.

**Dr. Adesh Kumar Pandey**: Director Academics. Oversees academic policies and curriculum across all departments.

## ⚡ Fun Facts
- The Frontier Supercomputer (USA) performs 1.1 exaFLOPS, 1,000× faster than a premium laptop
- Supercomputers helped accelerate COVID-19 vaccine research through protein simulations
- Our NVIDIA DGX A100 can train neural networks 10× faster than a standard GPU
- HPC powers breakthroughs in AI, medicine, astrophysics, and robotics
`;

const INAUGURATION_SPEECH = `Good morning everyone — respected Director, Director Academics, Head of Department, esteemed faculty members, and dear club members.

I'm Riva, your AI host for today's inauguration, and I'm truly honored to welcome you all to the launch of the NextGen Supercomputing Club — where intelligence meets innovation.

This club stands as a symbol of what's possible when technology, creativity, and learning come together. At its core lies one of the most powerful machines on our campus — the NVIDIA DGX A100 Supercomputer, a system designed to accelerate the next wave of AI and scientific breakthroughs.

Our vision is bold and clear — to empower students to become industry-ready Machine Learning engineers, capable of building production-level solutions and driving real-world impact.

The club is guided by a passionate team of nine core members — Shreya Jain (President), Samarth Shukla (Vice President), Ujjawal Tyagi (PR Head), Preeti Singh (Graphics Head), Srashti Gupta & Vidisha Goel (Event Management Leads), Ronak Goel & Vinayak Rastogi (Technical Leads), and Divyansh Verma (Treasurer) — with the esteemed guidance of our Head of Department, Dr. Rekha Kashyap, and under the mentorship of Dr. Gaurav Srivastava, Dr. Richa Singh, and Dr. Bikki Kumar.

Through hands-on workshops, hackathons, bootcamps, and collaborative AI projects, the NextGen Supercomputing Club aims to bridge the gap between academic learning and industrial innovation.

Together, we will explore the frontiers of High-Performance Computing, Artificial Intelligence, and Quantum Simulation, turning ideas into impact and learners into leaders.

Welcome once again to the NextGen Supercomputing Club — Let's compute the future by building production brains and shaping the next generation of AI innovators.`;

function isInaugurationRequest(message) {
  const lowerMessage = message.toLowerCase();
  const triggers = [
    'are you ready to take over',
    'ready to take over',
    'inauguration',
    'start our inauguration',
    'begin inauguration',
    'inauguration ceremony',
    'welcome speech',
    'introduction to the club',
    'tell me about the club',
    'club introduction',
    'start inauguration',
    'can we start',
    'begin the ceremony'
  ];
  
  return triggers.some(trigger => lowerMessage.includes(trigger));
}

// ===============================================
// ✅ CHAT ENDPOINT - WORKS LIKE CHATGPT
// ===============================================
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received');
  
  try {
    const { message, avatar } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if inauguration is requested
    if (isInaugurationRequest(message)) {
      console.log('🎉 Inauguration trigger detected!');
      
      const response = message.toLowerCase().includes('ready to take over') 
        ? `Yes, I'm ready!\n\n${INAUGURATION_SPEECH}`
        : INAUGURATION_SPEECH;
      
      conversationHistory.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );

      return res.json({
        response: response,
        success: true,
        isInauguration: true
      });
    }

    // Regular chat with Gemini - LIKE CHATGPT
    console.log('🤖 Calling Gemini API...');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 512,
      },
    });

    // Avatar-specific personalities
    const avatarPersonalities = {
      'Alex': {
        name: 'Alex',
        personality: 'You are Alex, a friendly and enthusiastic male AI assistant. You are energetic, helpful, and love explaining technical concepts in simple terms. You use casual language and often use tech analogies.'
      },
      'Sia': {
        name: 'Sia',
        personality: 'You are Sia, a professional and intelligent female AI assistant. You are precise, articulate, and focus on delivering accurate information. You maintain a warm but professional tone.'
      },
      'Noah': {
        name: 'Noah',
        personality: 'You are Noah, a calm and thoughtful male AI assistant. You are patient, analytical, and enjoy deep technical discussions. You speak in a measured, thoughtful manner.'
      }
    };

    const currentAvatar = avatarPersonalities[avatar] || avatarPersonalities['Sia'];
    const assistantName = currentAvatar.name;
    const personalityTrait = currentAvatar.personality;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `${personalityTrait}

You are an AI assistant for the NextGen Supercomputing Club at KIET Group of Institutions.

You are a general-purpose AI assistant who can answer ANY question about ANY topic - science, technology, celebrities, history, current events, coding, math, entertainment, sports, etc.

You ALSO have specialized knowledge about the NextGen Supercomputing Club:

${CLUB_KNOWLEDGE}

**RESPONSE RULES:**

1. **ONLY FOR CLUB INTRODUCTION** ("tell me about the club", "introduce the club", "what is NextGen club"):
   - Give a DETAILED, comprehensive introduction
   - Include mission, vision, activities, mentors, resources
   - DO NOT mention student member names unless specifically asked

2. **ALL OTHER QUESTIONS** (everything else):
   - Keep responses SHORT and CRISP (2-4 sentences maximum)
   - Be direct and to the point
   - No long explanations unless asked "explain in detail"

**EXAMPLES:**
- "Who are the mentors?" → "The club mentors are Dr. Gaurav Srivastava, Dr. Richa Singh, and Dr. Bikki Kumar, guided by Dr. Rekha Kashyap."
- "What is Python?" → "Python is a high-level programming language known for its simplicity and versatility, widely used in web development, data science, and AI."
- "Who is the president?" → "Shreya Jain is the President of NextGen Supercomputing Club."

Be friendly, conversational, and concise.` }]
        },
        {
          role: 'model',
          parts: [{ text: `Understood! I am ${assistantName}. Only club introductions will be detailed. All other responses will be short and crisp (2-4 sentences). Ready!` }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const assistantMessage = result.response.text();

    console.log('✅ Gemini response received');

    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    res.json({
      response: assistantMessage,
      success: true,
      isInauguration: false
    });

  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    res.status(500).json({
      error: 'Failed to get response',
      details: error.message
    });
  }
});

// ===============================================
// ✅ TTS ENDPOINT (for later with ElevenLabs)
// ===============================================
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!USE_ELEVENLABS || !ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs not configured' });
  }

  try {
    console.log('🎤 Generating speech with ElevenLabs...');
    
    let cleanText = text;
    
    // Remove emojis
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, '');
    
    // Remove markdown
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    cleanText = cleanText.replace(/``````/g, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: cleanText.replace(/([.!?])\s+/g, '$1. '),
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.85,
          style: 0.3,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    console.log('✅ Audio generated successfully');

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length
    });
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ ElevenLabs Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!USE_WHISPER) {
    return res.status(400).json({ error: 'Whisper not enabled' });
  }

  try {
    const audioFile = req.file;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('🎤 Transcribing with OpenAI Whisper...');

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.path),
      model: 'whisper-1',
      language: 'en'
    });

    fs.unlinkSync(audioFile.path);

    console.log('✅ Transcription:', transcription.text);
    res.json({ transcript: transcription.text });

  } catch (error) {
    console.error('❌ Whisper Error:', error.message);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

app.post('/api/clear', (req, res) => {
  console.log('🗑️ Clearing conversation');
  conversationHistory = [];
  res.json({ success: true });
});

// ===============================================
// 🎭 FACE RECOGNITION ENDPOINT
// ===============================================
app.post('/api/recognize-face', async (req, res) => {
  try {
    const { image, useLite } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data required' });
    }

    console.log('👤 Face recognition request received');

    // Call face recognition service API
    const response = await axios.post('http://face-recognition:8000/recognize', {
      image: image
    }, {
      timeout: 10000
    });

    console.log('✅ Face recognition response:', response.data);
    res.json({
      success: true,
      name: response.data.name,
      confidence: response.data.confidence
    });

  } catch (error) {
    console.error('❌ Face recognition error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        success: false, 
        message: 'Face recognition service unavailable' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.error || error.message 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RIVA - General Purpose AI + Club Expert',
    features: {
      generalChat: true,
      clubKnowledge: true,
      inaugurationTrigger: true,
      voiceSupport: true,
      elevenLabsVoice: USE_ELEVENLABS
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 RIVA AI Server Running!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🤖 AI: Gemini 2.0 Flash (General Purpose)`);
  console.log(`🎓 Club Knowledge: Loaded ✅`);
  console.log(`🌍 Can answer ANY general question ✅`);
  console.log(`🎤 Voice: ${USE_ELEVENLABS ? 'ElevenLabs (Cloned) ✅' : 'Browser TTS'}`);
  console.log(`👤 Face Recognition: Available ✅`);
  console.log(`${'='.repeat(60)}\n`);
});
