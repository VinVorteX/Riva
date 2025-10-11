// App.js - ELARA with ElevenLabs TTS
import ReactMarkdown from 'react-markdown';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import AudioSphere from './components/AudioSphere';

function App() {
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState(null);
  const [interimText, setInterimText] = useState('');
  
  // Script mode states
  const [mode, setMode] = useState('welcome');
  const [scriptLines, setScriptLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  const recognitionRef = useRef(null);
  const scriptPlayingRef = useRef(false);
  const currentAudioRef = useRef(null);

  // ✅ DEFINE handleSendMessage with useCallback BEFORE speech recognition setup
  const handleSendMessage = useCallback(async (text) => {
    if (mode !== 'chat') return;
    
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setInterimText('');

    try {
      console.log('📤 Sending to backend:', messageText);
      
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText })
      });

      const data = await response.json();
      console.log('📥 Received from backend:', data);

      if (data.success) {
        const assistantMessage = { role: 'assistant', content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
        speak(data.response);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('❌ Backend error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error connecting to the server. Please make sure the backend is running.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [mode, inputText]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('✅ Final transcript:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('🎤 Interim transcript:', transcript);
          }
        }

        if (interimTranscript) {
          setInterimText(interimTranscript);
          setInputText(interimTranscript);
        }

        if (finalTranscript) {
          console.log('🚀 AUTO-SENDING voice message:', finalTranscript);
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
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        setInterimText('');
        
        if (event.error === 'network') {
          setError('Network error: Check your internet connection. Speech recognition needs internet to work.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone in browser settings.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please speak louder and immediately after clicking the mic button.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not found or is being used by another app.');
        } else if (event.error === 'aborted') {
          setError('Speech recognition aborted. Please try again.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log('🎤 Recognition ended');
        setIsListening(false);
        setInterimText('');
      };

      recognitionRef.current.onstart = () => {
        console.log('🎤 Recognition started - SPEAK NOW!');
        setError(null);
        setInterimText('');
      };

      console.log('✅ Speech recognition initialized');
    } else {
      setError('Speech recognition not supported. Please use Google Chrome.');
      console.error('❌ Speech recognition not supported in this browser');
    }
  }, [handleSendMessage]);

  // Play inauguration script line by line
  const playInaugurationScript = async () => {
    console.log('🎬 Starting inauguration script...');
    setMode('script');
    setMessages([]);
    scriptPlayingRef.current = true;
    
    try {
      console.log('📜 Loading inauguration script...');
      const response = await fetch('http://localhost:5000/api/script/inauguration');
      const data = await response.json();
      
      if (!data.success || !data.script.enabled || !data.script.lines || data.script.lines.length === 0) {
        console.log('⚠️ No valid script, going to chat mode');
        setMode('chat');
        setMessages([{
          role: 'assistant',
          content: '👋 Hello! I\'m ELARA. How may I assist you today?'
        }]);
        scriptPlayingRef.current = false;
        return;
      }
      
      const lines = data.script.lines;
      console.log('✅ Script loaded:', lines.length, 'lines');
      setScriptLines(lines);
      
      // Play each line with timing for ElevenLabs
      for (let i = 0; i < lines.length; i++) {
        if (!scriptPlayingRef.current) {
          console.log('⏭️ Script skipped by user');
          break;
        }

        setCurrentLineIndex(i);
        const line = lines[i];
        
        console.log(`📢 Speaking line ${i + 1}/${lines.length}:`, line.text);
        
        // Start audio generation
        const audioPromise = speak(line.text);
        
        // Wait briefly before showing message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Show message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: line.text,
          isScript: true
        }]);

        // Wait for audio to finish
        await audioPromise;
        
        if (!scriptPlayingRef.current) {
          console.log('⏭️ Script skipped during speech');
          break;
        }
        
        await sleep(line.pauseAfter);
      }

      if (scriptPlayingRef.current) {
        console.log('✅ Inauguration script completed');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '🎯 Inauguration complete! I\'m now ready for your questions.',
          isScript: false
        }]);
      }

      setMode('chat');
      scriptPlayingRef.current = false;
      
    } catch (error) {
      console.error('❌ Error playing script:', error);
      setMode('chat');
      scriptPlayingRef.current = false;
      setMessages([{
        role: 'assistant',
        content: '⚠️ Error loading script. I\'m ELARA. How may I assist you today?'
      }]);
    }
  };

  const speak = async (text) => {
    if (isSpeaking) {
      stopSpeaking();
    }

    const cleanText = text.replace(/(\*|`|#|_|\[|\]|\(|\))/g, '');
    setIsSpeaking(true);

    try {
      console.log('🎤 Fetching audio from ElevenLabs:', cleanText);
      const response = await fetch('http://localhost:5000/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend responded with ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      currentAudioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error('❌ Error playing audio:', e);
          setIsSpeaking(false);
          setError('Error playing audio. Check ElevenLabs API credits.');
          resolve();
        };

        audio.play();
      });

    } catch (error) {
      console.error('❌ Error in speak function:', error);
      setIsSpeaking(false);
      setError(`TTS Error: ${error.message}`);
    }
  };

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const skipToChat = () => {
    console.log('⏭️ Skipping to chat mode');
    scriptPlayingRef.current = false;
    stopSpeaking();
    setMode('chat');
    setMessages([{
      role: 'assistant',
      content: '👋 Hello! I\'m ELARA. How may I assist you today?'
    }]);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && mode === 'chat') {
      try {
        setIsListening(true);
        setError(null);
        setInterimText('');
        console.log('🎤 Starting to listen...');
        recognitionRef.current.start();
        
        setTimeout(() => {
          console.log('💡 Speak now! Say something clearly and loudly.');
        }, 300);
        
      } catch (err) {
        console.error('Error starting recognition:', err);
        setIsListening(false);
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    }
  };

  const clearConversation = async () => {
    scriptPlayingRef.current = false;
    setMessages([]);
    setError(null);
    setInterimText('');
    stopSpeaking();
    setMode('welcome');
    
    try {
      await fetch('http://localhost:5000/api/clear', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  const testMicrophone = async () => {
    try {
      console.log('🎤 Testing microphone...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('✅ Microphone access granted');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let checkCount = 0;
      const maxChecks = 30;
      
      const checkLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        maxLevel = Math.max(maxLevel, average);
        checkCount++;
        
        console.log('🔊 Microphone level:', Math.round(average));
        
        if (checkCount >= maxChecks) {
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();
          
          if (maxLevel > 10) {
            alert(`✅ Microphone is working!\n\nMax level detected: ${Math.round(maxLevel)}\n\nYou can now use voice input.`);
            setError(null);
          } else {
            alert(`⚠️ Microphone level too low!\n\nMax level: ${Math.round(maxLevel)}\n\nPlease:\n1. Check microphone volume in Windows settings\n2. Speak louder\n3. Make sure correct microphone is selected`);
            setError('Microphone volume is too low. Please increase it in system settings.');
          }
        } else {
          setTimeout(checkLevel, 100);
        }
      };
      
      alert('🎤 Testing microphone...\n\nSpeak now for 3 seconds!\nSay something like "Hello, testing microphone"');
      checkLevel();
      
    } catch (err) {
      console.error('❌ Microphone test failed:', err);
      alert('❌ Microphone test failed!\n\n' + err.message + '\n\nPlease allow microphone access.');
      setError('Microphone test failed: ' + err.message);
    }
  };

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ audio: true })
      .then((stream) => {
        console.log('✅ Microphone access granted');
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((err) => {
        console.error('❌ Microphone access denied:', err);
        setError('Microphone access required. Please allow microphone permissions and refresh the page.');
      });
  }, []);

 return (
  <div className="App">
    {/* ✅ Audio-reactive golden sphere background */}
    <AudioSphere 
      isSpeaking={isSpeaking} 
      audioElement={currentAudioRef.current} 
    />
    
    <div className="container">
      <header className="header">
        <h1>🤖 Elara</h1>
        <p>Voice-powered AI Assistant</p>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {interimText && (
        <div className="interim-banner">
          🎤 Hearing: "{interimText}"
        </div>
      )}

      {mode === 'welcome' && (
        <div className="welcome-screen">
          <h2>Welcome to ELARA!</h2>
          <p>Choose how you'd like to start:</p>
          <div className="welcome-buttons">
            <button 
              onClick={playInaugurationScript}
              className="welcome-btn primary"
            >
              Play Inauguration Script
            </button>
            <button 
              onClick={skipToChat}
              className="welcome-btn secondary"
            >
               Go Directly to Chat
            </button>
          </div>
        </div>
      )}

      {(mode === 'script' || mode === 'chat') && (
        <div className="chat-container">
          <div className="messages">
            {messages.length === 0 && mode === 'chat' && (
              <div className="empty-state">
                <p style={{ fontSize: '1.2em', marginBottom: '15px' }}>
                   Hello! Ask me anything or click the microphone to speak.
                </p>
                <p style={{ fontSize: '1em', color: '#FFD700', marginTop: '15px', fontWeight: '500' }}>
                   Tips:
                </p>
                <ul style={{ fontSize: '0.95em', color: '#cccccc', textAlign: 'left', maxWidth: '450px', margin: '15px auto', lineHeight: '1.8' }}>
                  <li>Use Google Chrome browser</li>
                  <li>Allow microphone permissions</li>
                  <li>Speak immediately after clicking the mic button</li>
                  <li>Speak clearly and loudly</li>
                  <li>Test your microphone first using the button below</li>
                </ul>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role} ${msg.isScript ? 'script-message' : ''}`}>
                <div className="message-content">
                  <strong>{msg.role === 'user' ? '👤 You' : '🤖 Elara'}:</strong>
                  <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mode === 'chat' && (
            <>
              <div className="input-area">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={isListening ? " Listening... speak now!" : " Type your message or use voice..."}
                  disabled={isSpeaking}
                />
                
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isListening || isSpeaking}
                  className="send-btn"
                >
                   Send
                </button>
              </div>

              <div className="controls">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`voice-btn ${isListening ? 'listening' : ''}`}
                  disabled={isSpeaking}
                  title="Click and speak immediately"
                >
                  {isListening ? ' Listening... SPEAK NOW!' : ' Voice Input'}
                </button>

                <button 
                  onClick={testMicrophone} 
                  className="test-btn"
                  title="Test if your microphone is working"
                >
                   Test Mic
                </button>

                {isSpeaking && (
                  <button onClick={stopSpeaking} className="stop-btn">
                    Stop Speaking
                  </button>
                )}

                <button onClick={clearConversation} className="clear-btn">
                   Restart
                </button>
              </div>
            </>
          )}

          {mode === 'script' && (
            <div className="script-controls">
              <button onClick={skipToChat} className="skip-btn">
                 Skip to Chat
              </button>
            </div>
          )}

          <div className="status">
            {isListening && (
              <span className="status-listening">
                 Listening to your voice... SPEAK NOW! Say something clearly and loudly.
              </span>
            )}
            {isSpeaking && (
              <span className="status-speaking">
                 Elara is speaking...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}
export default App;
