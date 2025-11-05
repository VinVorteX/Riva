
// App.js - FINAL WORKING VERSION with Smooth AudioSphere
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import './App.css';
import AudioSphere from './components/AudioSphere';
import AvatarDemo from './components/AvatarDemo';
import FaceRecognition from './components/FaceRecognition';

// ICON COMPONENTS
const RestartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const TestMicIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);

const ContinuousIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'avatars'
  const [showInauguration, setShowInauguration] = useState(false);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  
  // Debug state changes
  useEffect(() => {
    console.log('🎯 App state changed:', { showFaceRecognition, showInauguration });
  }, [showFaceRecognition, showInauguration]);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  
  const recognitionRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const leftMessagesRef = useRef(null);
  const rightMessagesRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const lastAudioUpdateRef = useRef(0);
  const ttsInitializedRef = useRef(false);
  const isAISpeakingRef = useRef(false);
  const lastUserInputRef = useRef(Date.now());

  const scrollToBottom = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  };

  useEffect(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (assistantMessages.length > 0) {
      setTimeout(() => scrollToBottom(leftMessagesRef), 100);
    }
    
    if (userMessages.length > 0) {
      setTimeout(() => scrollToBottom(rightMessagesRef), 100);
    }
  }, [messages]);

  // ✨ TYPEWRITER EFFECT FUNCTION
  const typewriterEffect = useCallback((fullText, callback) => {
    let currentIndex = 0;
    setIsTyping(true);

    setMessages(prev => [...prev, { role: 'assistant', content: '', isTyping: true }]);

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        currentIndex++;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: fullText.substring(0, currentIndex)
          };
          return newMessages;
        });

        scrollToBottom(leftMessagesRef);

        const delay = Math.random() * 15 + 15;
        typingIntervalRef.current = setTimeout(typeNextChar, delay);
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            isTyping: false
          };
          return newMessages;
        });
        setIsTyping(false);
        if (callback) callback();
      }
    };

    typeNextChar();
  }, []);

  const handleSendMessage = useCallback(async (text) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setInterimText('');

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();

      if (data.success) {
        typewriterEffect(data.response);
        await speak(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Backend error:', error);
      const errorMessage = 'Sorry, I encountered an error connecting to the server.';
      typewriterEffect(errorMessage);
    }
  }, [inputText, typewriterEffect]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        // CRITICAL: Ignore if AI is speaking
        if (isAISpeakingRef.current) {
          console.log('🚫 Ignoring input - AI is speaking');
          return;
        }

        // CRITICAL: Ignore if too soon after AI finished speaking (within 2 seconds)
        const timeSinceLastInput = Date.now() - lastUserInputRef.current;
        if (timeSinceLastInput < 2000) {
          console.log('🚫 Ignoring input - too soon after AI speech');
          return;
        }

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
          setInputText(interimTranscript);
        }

        if (finalTranscript) {
          console.log('✅ Valid user input detected:', finalTranscript);
          lastUserInputRef.current = Date.now();
          setInputText(finalTranscript);
          setInterimText('');
          setIsListening(false);
          setError(null);
          
          setTimeout(() => {
            handleSendMessage(finalTranscript);
          }, 200);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setInterimText('');
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please speak louder.');
        } else {
          setError(`Speech error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current.onstart = () => {
        setError(null);
        setInterimText('');
      };
    }
  }, [handleSendMessage]);

  const speak = async (text) => {
    if (isSpeaking) stopSpeaking();

    // CRITICAL: Mark AI as speaking
    isAISpeakingRef.current = true;
    console.log('🔴 AI SPEAKING MODE ACTIVATED');

    // CRITICAL: Force stop listening when AI starts speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort(); // Use abort instead of stop for immediate effect
        setIsListening(false);
        console.log('🛑 FORCE STOPPED listening (AI speaking)');
      } catch (err) {
        console.log('⚠️ Could not stop recognition:', err);
      }
    }

    let cleanText = text;
    cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
    cleanText = cleanText.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '$1');
    cleanText = cleanText.replace(/\*(.+?)\*/g, '$1');
    cleanText = cleanText.replace(/^#+\s+/gm, '');
    cleanText = cleanText.replace(/``````/g, '');
    cleanText = cleanText.replace(/`([^`]+)`/g, '$1');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    cleanText = cleanText.replace(/^[\s]*[•\-\*]\s+/gm, '');
    cleanText = cleanText.replace(/^\d+\.\s+/gm, '');
    cleanText = cleanText.replace(/[_~|\\<>{}[\]]/g, '');
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    if (!cleanText) {
      console.log('⚠️ No text to speak');
      return;
    }

    console.log('🎤 Speaking:', cleanText.substring(0, 50) + '...');

    setIsSpeaking(true);

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.15;
      utterance.volume = 1.0;
      utterance.lang = 'en-IN';

      const getVoices = () => {
        return new Promise((resolve) => {
          let voices = window.speechSynthesis.getVoices();
          if (voices.length) {
            resolve(voices);
          } else {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve(voices);
            };
          }
        });
      };

      const voices = await getVoices();
      console.log('🔊 Available voices:', voices.length);
      console.log('🔊 All voices:', voices.map(v => `${v.name} (${v.lang})`));
      
      const femaleVoice = voices.find(v => 
        v.lang.includes('en-IN') && (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
      ) || voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.includes('en-'));
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
        console.log('🎤 Using voice:', femaleVoice.name, femaleVoice.lang);
      } else {
        console.log('⚠️ No suitable voice found, using default');
      }

      let targetAudioLevel = 0;
      const simulateAudioLevel = () => {
        const now = Date.now();
        if (now - lastAudioUpdateRef.current >= 100) {
          lastAudioUpdateRef.current = now;
          const baseLevel = Math.random() * 0.5 + 0.3;
          const variation = Math.sin(now / 200) * 0.15;
          targetAudioLevel = Math.max(0.2, Math.min(1, baseLevel + variation));
        }
        setAudioLevel(prev => prev + (targetAudioLevel - prev) * 0.15);
      };

      audioIntervalRef.current = setInterval(simulateAudioLevel, 50);

      return new Promise((resolve) => {
        utterance.onend = () => {
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setIsSpeaking(false);
          setAudioLevel(0);
          
          // CRITICAL: Mark AI as finished speaking
          isAISpeakingRef.current = false;
          console.log('🟢 AI SPEAKING MODE DEACTIVATED');
          console.log('✅ Speech ended - waiting 2 seconds before accepting new input');
          
          resolve();
        };

        utterance.onerror = (e) => {
          console.error('❌ TTS Error:', e);
          if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
          setIsSpeaking(false);
          setAudioLevel(0);
          resolve();
        };

        utterance.onstart = () => {
          console.log('✅ Speech started');
        };

        console.log('🎤 Calling speechSynthesis.speak()');
        window.speechSynthesis.cancel(); // Clear any pending speech
        window.speechSynthesis.speak(utterance);
        console.log('🎤 Speech queued');
      });

    } catch (error) {
      console.error('Speech error:', error);
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setIsSpeaking(false);
      setAudioLevel(0);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    setIsSpeaking(false);
    setAudioLevel(0);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && continuousMode) {
      try {
        setIsListening(true);
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const toggleContinuousMode = () => {
    // Initialize TTS on first user interaction
    if (!ttsInitializedRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      ttsInitializedRef.current = true;
      console.log('✅ TTS initialized');
    }
    
    const newMode = !continuousMode;
    setContinuousMode(newMode);
    
    if (newMode) {
      // Turning ON continuous mode - start listening
      if (recognitionRef.current && !isListening) {
        try {
          setIsListening(true);
          setError(null);
          recognitionRef.current.start();
        } catch (err) {
          setIsListening(false);
        }
      }
    } else {
      // Turning OFF continuous mode - stop listening
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  useEffect(() => {
    if (continuousMode && !isListening && !isSpeaking && !isTyping && !isAISpeakingRef.current) {
      // CRITICAL: Wait 2 seconds after AI finishes before restarting listening
      const timer = setTimeout(() => {
        console.log('⏰ Restarting listening after delay');
        startListening();
      }, 2000); // Increased from 500ms to 2000ms
      return () => clearTimeout(timer);
    }
  }, [continuousMode, isListening, isSpeaking, isTyping]);

  const clearConversation = async () => {
    // Initialize TTS on first user interaction
    if (!ttsInitializedRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      ttsInitializedRef.current = true;
      console.log('✅ TTS initialized');
    }
    
    setMessages([]);
    setError(null);
    stopSpeaking();
    
    if (typingIntervalRef.current) {
      clearTimeout(typingIntervalRef.current);
    }
    setIsTyping(false);
    
    try {
      await fetch('http://localhost:5000/api/clear', { method: 'POST' });
    } catch (error) {
      console.error('Error clearing:', error);
    }
  };

  const testMicrophone = async () => {
    // Initialize TTS on first user interaction
    if (!ttsInitializedRef.current) {
      const utterance = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(utterance);
      ttsInitializedRef.current = true;
      console.log('✅ TTS initialized');
    }
    
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let checkCount = 0;
      
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        maxLevel = Math.max(maxLevel, average);
        checkCount++;
        
        setAudioLevel(average / 128);
        
        if (checkCount >= 30) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          setAudioLevel(0);
          
          if (maxLevel > 10) {
            alert(`✅ Microphone working! Level: ${Math.round(maxLevel)}`);
          } else {
            alert(`⚠️ Low microphone level: ${Math.round(maxLevel)}`);
          }
        } else {
          setTimeout(checkLevel, 100);
        }
      };
      
      alert('Testing microphone...\n\nSpeak now for 3 seconds!');
      checkLevel();
      
    } catch (err) {
      alert('Microphone test failed!');
      setError('Microphone test failed');
    }
  };

  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  // Enable continuous mode function for inauguration
  const enableContinuousModeFromInauguration = () => {
    if (!continuousMode) {
      setContinuousMode(true);
      // Initialize TTS if not already done
      if (!ttsInitializedRef.current) {
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
        ttsInitializedRef.current = true;
        console.log('✅ TTS initialized from inauguration');
      }
      // Start listening after a brief delay
      setTimeout(() => {
        if (recognitionRef.current && !isListening) {
          try {
            setIsListening(true);
            setError(null);
            recognitionRef.current.start();
            console.log('✅ Continuous mode auto-enabled from inauguration');
          } catch (err) {
            setIsListening(false);
            console.error('❌ Failed to start listening from inauguration:', err);
          }
        }
      }, 1000);
    }
  };

  // Show Face Recognition Mode
  if (showFaceRecognition) {
    console.log('🎯 Rendering FaceRecognition component');
    return (
      <FaceRecognition 
        onComplete={() => {
          console.log('🎯 Face recognition completed, switching to inauguration');
          setShowFaceRecognition(false);
          setShowInauguration(true);
        }}
      />
    );
  }

  // Show Inauguration Mode
  if (showInauguration) {
    return (
      <AvatarDemo 
        onClose={() => setShowInauguration(false)}
        onComplete={() => setShowInauguration(false)}
        onEnableContinuousMode={enableContinuousModeFromInauguration}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="audiosphere-background">
        <AudioSphere audioLevel={audioLevel} isSpeaking={isSpeaking} />
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}
      {interimText && <div className="interim-banner">Listening: "{interimText}"</div>}
      {continuousMode && <div className="continuous-banner">🔄 Continuous Mode Active</div>}

      <div className="left-panel">
        <div className="panel-header">
          <h3>RIVA</h3>
        </div>
        <div className="messages-container" ref={leftMessagesRef}>
          {assistantMessages.length === 0 && (
            <div className="empty-state">
              {/* <p>Hello! I'm ELARA.</p>
              <p className="empty-hint">Ask me anything about NextGen Supercomputing Club!</p> */}
            </div>
          )}
          {assistantMessages.map((msg, idx) => (
            <div key={idx} className="message-bubble ai-message">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.isTyping && <span className="typing-cursor">▌</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel">
        <div className="panel-header">
          <h3>YOU</h3>
        </div>
        <div className="messages-container" ref={rightMessagesRef}>
          {userMessages.map((msg, idx) => (
            <div key={idx} className="message-bubble user-message">
              {msg.content}
            </div>
          ))}
        </div>
      </div>

      <div className="center-controls">
        <button 
          className={`control-btn continuous-btn ${continuousMode ? 'active' : ''}`}
          onClick={toggleContinuousMode}
          disabled={isSpeaking || isTyping}
          title="Continuous Mode"
        >
          <ContinuousIcon />
        </button>
        
        <button 
          className="control-btn restart-btn"
          onClick={clearConversation}
          title="Restart"
        >
          <RestartIcon />
        </button>
        
        <button 
          className="control-btn test-btn"
          onClick={testMicrophone}
          title="Test Microphone"
        >
          <TestMicIcon />
        </button>
        
        <button 
          className="control-btn avatar-btn"
          onClick={() => {
            console.log('🎯 Start Inauguration clicked - showing face recognition');
            setShowFaceRecognition(true);
          }}
          title="Start Inauguration"
          style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
        >
          🎉
        </button>
      </div>

      <div className="horizontal-input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          disabled={isSpeaking || isTyping}
          rows={1}
        />
        <button 
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isListening || isSpeaking || isTyping}
          className="send-btn-horizontal"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

export default App;
