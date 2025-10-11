// server.js - ELARA Complete with ElevenLabs TTS
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ElevenLabs Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const ELEVENLABS_MODEL_ID = 'eleven_multilingual_v2';

// Debug API keys on startup
console.log('🔑 Gemini API Key loaded:', process.env.GEMINI_API_KEY ? '✅' : '❌');
console.log('🔑 ElevenLabs API Key loaded:', ELEVENLABS_API_KEY ? '✅' : '❌');
console.log('🎙️ ElevenLabs Voice ID:', ELEVENLABS_VOICE_ID);

// Store conversation history
let conversationHistory = [];

// ===============================================
// ✅ ELEVENLABS TTS ENDPOINT ====================
// ===============================================
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ElevenLabs API key not configured in .env file' });
  }

  try {
    console.log('🎤 Generating speech with ElevenLabs...');
    
    // ✅ CLEAN TEXT: Remove emojis, markdown, and special characters
    let cleanText = text;
    
    // Remove all emojis (comprehensive Unicode ranges)
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{2700}-\u{27BF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F000}-\u{1F02F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F100}-\u{1F64F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F910}-\u{1F96B}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F980}-\u{1F9E0}]/gu, '');
    
    // Remove markdown formatting
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');     // Italic
    cleanText = cleanText.replace(/^#+\s+/gm, '');         // Headers
    cleanText = cleanText.replace(/``````/g, '');  // Code blocks
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');     // Inline code
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Links
    cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, ''); // Bullet points
    
    // Clean up extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    console.log('📝 Original length:', text.length);
    console.log('🧹 Cleaned length:', cleanText.length);
    
    // Call ElevenLabs API
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: cleanText,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    console.log('✅ Audio generated successfully from ElevenLabs');

    // Send audio back to frontend
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': response.data.length
    });
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('❌ ElevenLabs TTS Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        error: 'Invalid ElevenLabs API key. Please check your ELEVENLABS_API_KEY in .env file.' 
      });
    } else if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'ElevenLabs API rate limit exceeded. Please wait a moment and try again.' 
      });
    } else if (error.response?.status === 403) {
      return res.status(403).json({ 
        error: 'ElevenLabs API quota exceeded. Check your credit balance at elevenlabs.io' 
      });
    } else if (error.response?.data) {
      const errorMessage = Buffer.isBuffer(error.response.data) 
        ? error.response.data.toString() 
        : JSON.stringify(error.response.data);
      return res.status(500).json({ error: `ElevenLabs API error: ${errorMessage}` });
    }
    
    res.status(500).json({ error: 'Failed to generate speech: ' + error.message });
  }
});

// ===============================================
// ✅ GEMINI CHAT ENDPOINT =======================
// ===============================================
app.post('/api/chat', async (req, res) => {
  console.log('📨 Chat request received');
  
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('🤖 Calling Google Gemini 2.5 API...');

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.9,
        topP: 1,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are ELARA, an female AI assistant for the NextGen Supercomputing Lab. You are helpful, friendly, and knowledgeable. Be friendly not that formal. Keep responses short and precise, unless asked in detail. Give well-formatted responses with proper markdown: use **bold** for emphasis, bullet points for lists, numbered lists for steps, code blocks for code, and emojis to make responses engaging. Structure your answers clearly with line breaks and proper formatting.' }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I am ELARA, your female AI assistant for the NextGen Supercomputing Lab. I will provide **helpful** and well-formatted responses with:\n\n• Bullet points for lists\n• **Bold text** for emphasis\n• Proper line breaks\n• Emojis 🤖 for engagement\n• Code blocks when needed\n\nHow may I assist you today?' }]
        },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const result = await chat.sendMessage(message);
    const assistantMessage = result.response.text();

    console.log('✅ Gemini API response received');

    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );

    // Keep only last 20 messages
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
      console.log('🔄 Conversation history trimmed');
    }

    res.json({
      response: assistantMessage,
      success: true
    });

  } catch (error) {
    console.error('❌ Gemini Error:', error.message);

    if (error.message.includes('API_KEY_INVALID')) {
      res.status(401).json({
        error: 'Invalid Gemini API key',
        details: 'Check your GEMINI_API_KEY in .env file'
      });
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      res.status(429).json({
        error: 'Quota exceeded',
        details: 'Free tier limit reached (15/min or 1500/day)'
      });
    } else {
      res.status(500).json({
        error: 'Failed to get response from Gemini',
        details: error.message
      });
    }
  }
});

// ===============================================
// ✅ INAUGURATION SCRIPT ENDPOINT ===============
// ===============================================
app.get('/api/script/inauguration', (req, res) => {
  try {
    const scriptPath = path.join(__dirname, 'inauguration-script.json');
    
    if (!fs.existsSync(scriptPath)) {
      console.log('⚠️ Script file not found, creating default...');
      
      const defaultScript = {
        inauguration: {
          enabled: true,
          autoPlay: false,
          lines: [
            {
              id: 1,
              text: "Good morning everyone! I am ELARA, your AI assistant, and I'm thrilled to welcome you to the NextGen Supercomputing Club inauguration!",
              pauseAfter: 25
            },
            {
              id: 2,
              text: "Our club is established with a vision to produce industry ready ML engineers from our college and to democratize artificial intelligence and make cutting-edge technology accessible to all students.",
              pauseAfter: 25
            },
            {
              id: 3,
              text: "Our primary objectives are: First, to provide hands-on experience with AI and machine learning technologies.",
              pauseAfter: 25
            },
            {
              id: 4,
              text: "Second, to foster innovation through collaborative projects and research.",
              pauseAfter: 25
            },
            {
              id: 5,
              text: "And third, to build a community of future AI leaders and innovators.",
              pauseAfter: 25
            },
            {
              id: 6,
              text: "Now, let me introduce our amazing team. Our President Shreya Jain, who leads with vision and dedication.",
              pauseAfter: 25
            },
            {
              id: 7,
              text: "Our Vice President Samarth Shukla, who ensures everything runs smoothly and coordinates our activities.",
              pauseAfter: 25
            },
            {
              id: 8,
              text: "And our talented team members who make everything possible with their skills and dedication.",
              pauseAfter: 25
            },
            {
              id: 9,
              text: "This lab is equipped with high-performance computing resources, GPUs for deep learning, and collaborative workspaces for innovation.",
              pauseAfter: 25
            },
            {
              id: 10,
              text: "That concludes our introduction. I'm now ready to answer any questions you may have about our club, AI technologies, or anything else! How may I assist you?",
              pauseAfter: 25
            }
          ]
        }
      };
      
      fs.writeFileSync(scriptPath, JSON.stringify(defaultScript, null, 2));
      console.log('✅ Default script file created');
    }
    
    const scriptData = fs.readFileSync(scriptPath, 'utf8');
    const script = JSON.parse(scriptData);
    
    console.log('📜 Inauguration script requested');
    
    res.json({
      success: true,
      script: script.inauguration
    });
  } catch (error) {
    console.error('❌ Error loading script:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to load inauguration script',
      details: error.message
    });
  }
});

// Update script
app.post('/api/script/update', (req, res) => {
  try {
    const { script } = req.body;
    const scriptPath = path.join(__dirname, 'inauguration-script.json');
    
    fs.writeFileSync(scriptPath, JSON.stringify({ inauguration: script }, null, 2));
    
    console.log('✅ Script updated successfully');
    
    res.json({
      success: true,
      message: 'Script updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating script:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update script'
    });
  }
});

// Clear conversation history
app.post('/api/clear', (req, res) => {
  console.log('🗑️ Clearing conversation history');
  conversationHistory = [];
  res.json({ 
    success: true, 
    message: 'Conversation cleared'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ELARA - AI Server with ElevenLabs TTS',
    timestamp: new Date().toISOString(),
    aiModel: 'gemini-2.0-flash-exp',
    ttsProvider: 'ElevenLabs',
    voiceId: ELEVENLABS_VOICE_ID,
    features: {
      chat: true,
      inaugurationScript: true,
      voiceSupport: true,
      ttsProvider: 'ElevenLabs'
    }
  });
});

// Test Gemini API
app.get('/api/test-gemini', async (req, res) => {
  try {
    console.log('🔍 Testing Gemini API...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent('Say "Hello! ELARA is powered by Gemini 2.0 Flash and working perfectly!"');
    const response = result.response.text();

    console.log('✅ Gemini API test successful');
    
    res.json({
      success: true,
      message: 'Gemini API working perfectly',
      response: response,
      model: 'gemini-2.0-flash-exp'
    });
  } catch (error) {
    console.error('❌ Gemini test failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Gemini test failed',
      details: error.message
    });
  }
});

// Test ElevenLabs API
app.get('/api/test-elevenlabs', async (req, res) => {
  try {
    console.log('🔍 Testing ElevenLabs API...');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/user',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    console.log('✅ ElevenLabs API test successful');
    
    res.json({
      success: true,
      message: 'ElevenLabs API working perfectly',
      userInfo: {
        tier: response.data.subscription?.tier || 'free',
        characterCount: response.data.subscription?.character_count || 0,
        characterLimit: response.data.subscription?.character_limit || 10000
      }
    });
  } catch (error) {
    console.error('❌ ElevenLabs test failed:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'ElevenLabs test failed',
      details: error.response?.data || error.message
    });
  }
});

// List available ElevenLabs voices
app.get('/api/voices', async (req, res) => {
  try {
    console.log('🔍 Fetching available ElevenLabs voices...');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const response = await axios({
      method: 'GET',
      url: 'https://api.elevenlabs.io/v1/voices',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    console.log('✅ Voices fetched successfully');
    
    res.json({
      success: true,
      voices: response.data.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description
      }))
    });
  } catch (error) {
    console.error('❌ Failed to fetch voices:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch voices',
      details: error.response?.data || error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ELARA AI Server is running!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🤖 AI Model: Google Gemini 2.0 Flash`);
  console.log(`🎤 TTS: ElevenLabs ${ELEVENLABS_API_KEY ? '✅' : '❌ NOT CONFIGURED'}`);
  console.log(`🎙️ Voice ID: ${ELEVENLABS_VOICE_ID}`);
  console.log(`📊 Model: ${ELEVENLABS_MODEL_ID}`);
  console.log(`\n🔗 Available Endpoints:`);
  console.log(`   • POST /api/chat              - Main chat (Gemini 2.0)`);
  console.log(`   • POST /api/tts               - Text-to-Speech (ElevenLabs)`);
  console.log(`   • GET  /api/script/inauguration - Get inauguration script`);
  console.log(`   • POST /api/script/update     - Update inauguration script`);
  console.log(`   • GET  /api/voices            - List ElevenLabs voices`);
  console.log(`   • GET  /api/test-gemini       - Test Gemini connection`);
  console.log(`   • GET  /api/test-elevenlabs   - Test ElevenLabs connection`);
  console.log(`   • POST /api/clear             - Clear conversation history`);
  console.log(`   • GET  /api/health            - Health check`);
  console.log(`${'='.repeat(60)}\n`);
});
