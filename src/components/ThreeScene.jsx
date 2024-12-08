import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesVelocityRef = useRef([]); // Stores velocities for particles

  const [settings, setSettings] = useState({
    numParticles: 500,
    dimensions: 100,
    speed: 2,
    viscosity: 0.95,
    trailLength: 2,
    colors: [0xff0000, 0x00ff00, 0x0000ff], // Red, green, blue
  });

  // Initialize the scene
  const initializeScene = () => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 120, 150);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    const cubeGeometry = new THREE.BoxGeometry(
      settings.dimensions,
      settings.dimensions,
      settings.dimensions
    );
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const cubeOutline = new THREE.LineSegments(edges, edgesMaterial);
    scene.add(cubeOutline);
  };

  // Initialize particles using InstancedMesh
  const initializeParticles = () => {
    const { numParticles, dimensions, colors } = settings;

    // Remove old particle system
    const oldParticles = sceneRef.current.getObjectByName("particleMesh");
    if (oldParticles) sceneRef.current.remove(oldParticles);

    // Create shared geometry and material
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particleMesh = new THREE.InstancedMesh(geometry, material, numParticles);
    particleMesh.name = "particleMesh";

    const dummyObject = new THREE.Object3D();
    const velocities = [];

    for (let i = 0; i < numParticles; i++) {
      // Random initial position
      const x = Math.random() * dimensions - dimensions / 2;
      const y = Math.random() * dimensions - dimensions / 2;
      const z = Math.random() * dimensions - dimensions / 2;

      dummyObject.position.set(x, y, z);
      dummyObject.updateMatrix();
      particleMesh.setMatrixAt(i, dummyObject.matrix);

      // Assign random velocities
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * settings.speed,
          (Math.random() - 0.5) * settings.speed,
          (Math.random() - 0.5) * settings.speed
        )
      );
    }

    particleMesh.instanceMatrix.needsUpdate = true;
    sceneRef.current.add(particleMesh);
    particlesVelocityRef.current = velocities; // Save velocities
  };

  // Animate particles
  const animateParticles = () => {
    const { dimensions, viscosity } = settings;
    const particleMesh = sceneRef.current.getObjectByName("particleMesh");
  
    if (!particleMesh) return;
  
    const dummyObject = new THREE.Object3D(); // Helper object
    const velocities = particlesVelocityRef.current; // Particle velocities
  
    for (let i = 0; i < settings.numParticles; i++) {
      const velocity = velocities[i];
  
      // Retrieve the particle's current matrix
      particleMesh.getMatrixAt(i, dummyObject.matrix);
      dummyObject.matrix.decompose(dummyObject.position, dummyObject.quaternion, dummyObject.scale);
  
      // Update position using velocity
      dummyObject.position.add(velocity);
  
      // Bounce off walls and apply viscosity
      ["x", "y", "z"].forEach((axis) => {
        if (
          dummyObject.position[axis] > dimensions / 2 ||
          dummyObject.position[axis] < -dimensions / 2
        ) {
          velocity[axis] = -velocity[axis]; // Reverse direction
        }
        velocity[axis] *= viscosity; // Apply viscosity damping
      });
  
      // Update matrix with new position
      dummyObject.updateMatrix();
      particleMesh.setMatrixAt(i, dummyObject.matrix);
    }
  
    // Notify Three.js to update the instance matrix
    particleMesh.instanceMatrix.needsUpdate = true;
  };
  

  // Adaptive animation loop
  let frameCount = 0;
  const animate = () => {
    const start = performance.now();

    if (frameCount % 2 === 0) {
      animateParticles();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    frameCount++;
    const end = performance.now();

    if (end - start > 16) {
      console.warn(`[Performance Warning] Frame time: ${end - start}ms`);
    }

    requestAnimationFrame(animate);
  };

  useEffect(() => {
    initializeScene();
    initializeParticles();
    animate();

    return () => {
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    initializeParticles();
  }, [settings]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={containerRef} style={{ flex: 1 }} />
      <div style={{ width: "300px", padding: "10px", background: "#222", color: "#fff" }}>
        <h3>Settings</h3>
        <label>
          Particle Count:
          <input
            type="number"
            value={settings.numParticles}
            onChange={(e) =>
              setSettings({ ...settings, numParticles: parseInt(e.target.value, 10) })
            }
          />
        </label>
        <br />
        <label>
          Dimensions:
          <input
            type="number"
            value={settings.dimensions}
            onChange={(e) =>
              setSettings({ ...settings, dimensions: parseInt(e.target.value, 10) })
            }
          />
        </label>
        <br />
        <label>
          Speed:
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={settings.speed}
            onChange={(e) =>
              setSettings({ ...settings, speed: parseFloat(e.target.value) })
            }
          />
        </label>
      </div>
    </div>
  );
};

export default ThreeScene;

