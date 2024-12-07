import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/ThreeScene.module.css'; // Ensure this file exists and has proper styles

const ThreeScene = ({ settings, blockData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cubeRef = useRef(null); // Ref for test geometry

  useEffect(() => {
    // Ensure the container is valid
    const container = containerRef.current;
    if (!container) {
      console.error('Container ref is null.');
      return;
    }

    if (debug) {
      console.log('ThreeScene component has mounted');
    }

    console.log('Initializing Three.js scene...');

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5); // Adjust to view the cube
    camera.lookAt(0, 0, 0);

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000); // Black background
    console.log('Appending renderer DOM element...');
    container.appendChild(renderer.domElement);

    // Add test geometry (a simple cube)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, 0); // Centered in the scene
    scene.add(cube);

    console.log('Test cube added to scene:', cube);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      renderer.render(scene, camera);
      console.log('Frame rendered');
      requestAnimationFrame(animate);
    };
    animate();

    renderer.setPixelRatio(window.devicePixelRatio);
    window.addEventListener('resize', () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Cleanup on unmount
    return () => {
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (blockData && sceneRef.current) {
      console.log('Block data updated:', blockData);
      const { nonce } = blockData;

      // Example: use nonce to update colors or geometry
      const colors = generateColorsFromNonce(nonce, settings.numParticles || 5);
      console.log('Generated colors:', colors);

      // Update logic (e.g., re-generate particles) goes here
    }
  }, [blockData, settings]);

  return <div ref={containerRef} className="container" />;
};

export default ThreeScene;



