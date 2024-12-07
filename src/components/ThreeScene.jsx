import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import '../styles/ThreeScene.module.css'; // Ensure this file exists and has proper styles

const ThreeScene = ({ settings, blockData, debug = false }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cubeRef = useRef(null); // Ref for test geometry

  useEffect(() => {
    if (debug) console.log('Initializing Three.js scene...');

    // Ensure the container exists
    const container = containerRef.current;
    if (!container) {
      console.error('Container ref is null.');
      return;
    }

    // Initialize Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000); // Black background
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // OrbitControls for Camera
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Add Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Add Test Geometry (Cube)
    const cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 0, 0);
    scene.add(cube);
    cubeRef.current = cube;

    // Animation Loop
    const animate = () => {
      if (cubeRef.current) {
        // Rotate the cube for visualization
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
      }

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    if (debug) console.log('Three.js scene initialized.');

    // Cleanup on Unmount
    return () => {
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [debug]);

  useEffect(() => {
    if (blockData) {
      if (debug) console.log('Block data updated:', blockData);
      // Process blockData to update scene elements (e.g., colors, particles)
    }
  }, [blockData, debug]);

  return (
    <div ref={containerRef} className="container" />
  );
};

export default ThreeScene;