import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/ThreeScene.module.css'; // Ensure the CSS file exists

const ThreeScene = ({ settings, blockData, debug = true }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesGroupRef = useRef(null); // To dynamically update particles

  // Create and initialize the Three.js scene
  useEffect(() => {
    if (debug) console.log('Initializing Three.js scene...');
    const container = containerRef.current;

    if (!container) {
      console.error('Container ref is null.');
      return;
    }
    console.log('Container dimensions:', container.clientWidth, container.clientHeight);

    // Initialize Scene, Camera, and Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 800);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement); // Attaches the canvas
    rendererRef.current = renderer;

    console.log('Renderer DOM Element:', renderer.domElement);

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      console.log('Resizing canvas to:', width, height); // Debug dimensions
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Test Cube
    const geometry = new THREE.BoxGeometry(50, 50, 50);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    // Rotate the cube in the animation loop
    const animate = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      console.log('Cleaning up Three.js scene...');
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [debug]);

  // Update scene when block data changes
  useEffect(() => {
    if (blockData) {
      if (debug) console.log('Block data updated:', blockData);

      const { nonce } = blockData;
      const colors = Array.from({ length: settings.numParticles }, (_, i) =>
        `hsl(${(nonce + i * 50) % 360}, 50%, 50%)`
      );

      // Remove previous particles group if it exists
      if (particlesGroupRef.current) {
        sceneRef.current.remove(particlesGroupRef.current);
      }

      // Create a new particle group
      const particlesGroup = new THREE.Group();
      colors.forEach((color, index) => {
        const particle = new THREE.Mesh(
          new THREE.SphereGeometry(5),
          new THREE.MeshBasicMaterial({ color })
        );
        particle.position.set(
          Math.random() * settings.dimensions - settings.dimensions / 2,
          Math.random() * settings.dimensions - settings.dimensions / 2,
          Math.random() * settings.dimensions - settings.dimensions / 2
        );
        particlesGroup.add(particle);
      });

      sceneRef.current.add(particlesGroup);
      particlesGroupRef.current = particlesGroup;
    }
  }, [blockData, settings, debug]);

  return <div ref={containerRef} className="container" />

};

export default ThreeScene;