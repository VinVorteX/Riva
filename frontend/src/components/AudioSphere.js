import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const AudioSphere = ({ isSpeaking, audioElement }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const sphereRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const rendererRef = useRef(null);
  const animationIdRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create golden wireframe sphere
    const geometry = new THREE.IcosahedronGeometry(1, 4);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Add inner glow sphere
    const glowGeometry = new THREE.SphereGeometry(0.95, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.1
    });
    const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
    sphere.add(glowSphere);

    // Particles around sphere
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 5;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.005,
      color: 0xFFD700,
      transparent: true,
      opacity: 0.4
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Audio context setup
    let audioContext = null;
    let analyser = null;
    let dataArray = null;

    if (audioElement) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioElement);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      } catch (error) {
        console.log('Audio context setup skipped:', error);
      }
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      let scale = 1;
      let rotationSpeed = 0.001;

      // Get audio data if available
      if (isSpeaking && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Calculate average frequency
        const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
        
        // Map frequency to scale (1.0 to 1.5)
        scale = 1 + (average / 255) * 0.5;
        rotationSpeed = 0.005 + (average / 255) * 0.01;

        // Deform vertices based on frequency
        const positionAttribute = sphere.geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
          vertex.fromBufferAttribute(positionAttribute, i);
          
          const frequencyIndex = Math.floor((i / positionAttribute.count) * dataArrayRef.current.length);
          const frequency = dataArrayRef.current[frequencyIndex] / 255;
          
          vertex.normalize();
          const distance = 1 + frequency * 0.3;
          vertex.multiplyScalar(distance);
          
          positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        
        positionAttribute.needsUpdate = true;
      } else {
        // Idle animation when not speaking
        scale = 1 + Math.sin(Date.now() * 0.001) * 0.1;
      }

      // Apply transformations
      sphere.scale.set(scale, scale, scale);
      sphere.rotation.x += rotationSpeed;
      sphere.rotation.y += rotationSpeed * 0.7;

      // Rotate particles
      particlesMesh.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (audioContext) {
        audioContext.close();
      }
      
      geometry.dispose();
      material.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
    };
  }, [audioElement]);

  // Update speaking state
  useEffect(() => {
    if (sphereRef.current) {
      const material = sphereRef.current.material;
      material.opacity = isSpeaking ? 1 : 0.6;
    }
  }, [isSpeaking]);

  return (
    <div 
      ref={containerRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
      }}
    />
  );
};
export default AudioSphere;
