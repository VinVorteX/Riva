import React, { useState, useEffect, useRef } from 'react';
import './FaceRecognition.css';

const FaceRecognition = ({ onComplete }) => {
  console.log('🎯 FaceRecognition component mounted');
  const [isActive, setIsActive] = useState(false);
  
  // Add debug state logging
  console.log('🎯 FaceRecognition props:', { onComplete });
  const [recognizedPeople, setRecognizedPeople] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const greetedPeople = useRef(new Set());

  const DIGNITARIES = {
    "Gaurav": "Dr. Gaurav Srivastava, our esteemed mentor",
    "Richa": "Dr. Richa Singh, our respected mentor", 
    "Rekha": "Dr. Rekha Kashyap, Head of Department",
    "Manoj": "Dr. Manoj Goel, our Director",
    "Adesh": "Dr. Adesh Kumar Pandey, Director Academics",
    "Rajeev": "Dr. Rajeev, our respected faculty",
    "Abhinav": "Abhinav, our valued team member",
    "Vinayak": "Vinayak Rastogi, Technical Lead and Developer of RIVA"
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
      startRecognitionLoop();
      startCountdown();
    }
    return () => {
      cleanup();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      setCurrentMessage('❌ Camera access failed. Please allow camera permissions.');
    }
  };

  const startRecognitionLoop = () => {
    intervalRef.current = setInterval(() => {
      if (!isProcessing) {
        captureAndRecognize();
      }
    }, 2000); // Check every 2 seconds
  };

  const startCountdown = () => {
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          proceedToSpeeches();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = countdown;
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert canvas to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
      // Send to face recognition API
      const response = await fetch('/api/recognize-dignitary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.name && DIGNITARIES[result.name]) {
          handleRecognition(result.name, result.confidence);
        }
      }
    } catch (error) {
      console.error('Recognition failed:', error);
    }

    setIsProcessing(false);
  };

  const handleRecognition = async (name, confidence) => {
    // Prevent duplicate greetings
    if (greetedPeople.current.has(name)) {
      return;
    }

    greetedPeople.current.add(name);
    const formalName = DIGNITARIES[name];

    setCurrentMessage(`🎯 Recognized: ${name} (${confidence}%)`);

    // Send greeting to RIVA
    try {
      const response = await fetch('/api/greet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dignitary: formalName })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRecognizedPeople(prev => [...prev, {
            name: formalName,
            greeting: data.greeting,
            time: new Date().toLocaleTimeString()
          }]);
          
          setCurrentMessage(`🎤 Speaking: ${data.greeting.substring(0, 100)}...`);
          
          // Speak the greeting with better voice settings
          const utterance = new SpeechSynthesisUtterance(data.greeting);
          utterance.rate = 0.85;
          utterance.pitch = 1.1;
          utterance.volume = 1.0;
          utterance.lang = 'en-IN';
          
          // Try to use a good voice
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v => 
            v.lang.includes('en-IN') || v.lang.includes('en-US')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          
          utterance.onstart = () => {
            setCurrentMessage(`🔊 Speaking to ${formalName}...`);
          };
          
          utterance.onend = () => {
            setCurrentMessage(`✅ Greeted ${formalName} successfully!`);
          };
          
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Greeting failed:', error);
      setCurrentMessage(`❌ Failed to greet ${formalName}`);
    }
  };

  const proceedToSpeeches = () => {
    cleanup();
    setCurrentMessage('🎤 Proceeding to AI speeches...');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    window.speechSynthesis.cancel();
  };

  const skipRecognition = () => {
    proceedToSpeeches();
  };

  return (
    <div className="face-recognition-container">
      {!isActive ? (
        <div className="recognition-start">
          <h2>🎯 Dignitary Recognition</h2>
          <p>Ready to greet our esteemed dignitaries before the AI speeches</p>
          <button 
            className="start-recognition-btn"
            onClick={() => setIsActive(true)}
          >
            Start Recognition
          </button>
        </div>
      ) : (
        <div className="recognition-active">
          <div className="recognition-header">
            <h2>🎤 RIVA Dignitary Recognition</h2>
            <div className="countdown">
              Time remaining: {timeLeft}s
            </div>
          </div>

          <div className="recognition-content">
            <div className="camera-section">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                className="camera-feed"
              />
              <canvas 
                ref={canvasRef} 
                style={{ display: 'none' }}
              />
              <div className="camera-overlay">
                <div className="scan-line"></div>
                <p>Looking for dignitaries...</p>
              </div>
            </div>

            <div className="recognition-info">
              <div className="current-status">
                <h3>Status</h3>
                <p>{currentMessage || 'Monitoring for dignitaries...'}</p>
                {isProcessing && <div className="processing-indicator">🔄 Processing...</div>}
              </div>

              <div className="recognized-list">
                <h3>Greeted Dignitaries ({recognizedPeople.length})</h3>
                <div className="dignitary-list">
                  {recognizedPeople.map((person, index) => (
                    <div key={index} className="dignitary-item">
                      <div className="dignitary-name">✅ {person.name}</div>
                      <div className="dignitary-time">{person.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="monitoring-info">
                <h4>Monitoring for:</h4>
                <div className="dignitary-grid">
                  {Object.entries(DIGNITARIES).map(([key, name]) => (
                    <div 
                      key={key} 
                      className={`dignitary-badge ${greetedPeople.current.has(key) ? 'greeted' : ''}`}
                    >
                      {name.split(',')[0]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="recognition-controls">
            <button 
              className="skip-btn"
              onClick={skipRecognition}
            >
              Skip Recognition & Start Speeches
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceRecognition;