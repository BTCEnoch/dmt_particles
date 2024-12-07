import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/ThreeScene.module.css'; // Ensure it exists and styled

const ThreeScene = ({ settings, blockData }) => {
  const containerRef = useRef(null);
  const particlesGroupRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    console.log('Initializing Three.js scene...');
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (blockData) {
      console.log('Block data received:', blockData);
      // Process blockData (e.g., update particles/colors based on blockData.nonce)
    }
  }, [blockData]);

  return <div ref={containerRef} className="container" />;
};

export default ThreeScene;



