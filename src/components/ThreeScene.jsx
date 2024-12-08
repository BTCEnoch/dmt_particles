import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const particlesRef = useRef([]);
  const trailsRef = useRef([]);

  const [settings, setSettings] = useState({
    numParticles: 500,
    dimensions: 100,
    speed: 2,
    viscosity: 0.95,
    cutoff: 20,
    collisionRadius: 5,
    trailLength: 2, // Keep trails short for a tight-following effect
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

  // Initialize particles and trails
  const initializeParticles = () => {
    const particles = [];
    const trails = [];
    const { numParticles, dimensions, colors } = settings;

    particlesRef.current.forEach((particle) => {
      sceneRef.current.remove(particle);
    });
    trailsRef.current.forEach((trail) => {
      sceneRef.current.remove(trail);
    });

    for (let i = 0; i < numParticles; i++) {
      // Create particle geometry
      const geometry = new THREE.SphereGeometry(Math.random() * 0.5 + 0.5, 16, 16);
      const colorIndex = Math.floor(Math.random() * colors.length);
      const material = new THREE.MeshBasicMaterial({
        color: colors[colorIndex],
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const particle = new THREE.Mesh(geometry, material);

      // Set random initial position
      particle.position.set(
        Math.random() * dimensions - dimensions / 2,
        Math.random() * dimensions - dimensions / 2,
        Math.random() * dimensions - dimensions / 2
      );

      // Set random velocity
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * settings.speed,
        (Math.random() - 0.5) * settings.speed,
        (Math.random() - 0.5) * settings.speed
      );

      particle.colorIndex = colorIndex;

      // Create trail geometry
      const trailGeometry = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(6); // 2 points for a short trail
      for (let j = 0; j < 6; j += 3) {
        trailPositions[j + 0] = particle.position.x; // X
        trailPositions[j + 1] = particle.position.y; // Y
        trailPositions[j + 2] = particle.position.z; // Z
      }

      trailGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(trailPositions, 3)
      );

      const trailMaterial = new THREE.LineBasicMaterial({
        color: colors[colorIndex],
        transparent: true,
        opacity: 0.5,
      });

      const trail = new THREE.Line(trailGeometry, trailMaterial);

      // Add particle and trail to the scene
      sceneRef.current.add(particle);
      sceneRef.current.add(trail);

      particles.push(particle);
      trails.push(trail);
    }

    particlesRef.current = particles;
    trailsRef.current = trails;
  };

  // Animate particles and trails
  const animateParticles = () => {
    const particles = particlesRef.current;
    const trails = trailsRef.current;
    const { dimensions } = settings;

    particles.forEach((particle, index) => {
      // Update particle position
      particle.position.add(particle.velocity);

      // Bounce off walls
      ["x", "y", "z"].forEach((axis) => {
        if (
          particle.position[axis] > dimensions / 2 ||
          particle.position[axis] < -dimensions / 2
        ) {
          particle.velocity[axis] = -particle.velocity[axis];
        }
      });

      // Update trail to follow the particle
      const trail = trails[index];
      const positions = trail.geometry.attributes.position.array;

      // Update the last point to match the current particle position
      positions[3] = positions[0];
      positions[4] = positions[1];
      positions[5] = positions[2];

      positions[0] = particle.position.x;
      positions[1] = particle.position.y;
      positions[2] = particle.position.z;

      trail.geometry.attributes.position.needsUpdate = true; // Notify Three.js
    });
  };

  const animate = () => {
    animateParticles();
    rendererRef.current.render(sceneRef.current, cameraRef.current);
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
          Trail Length:
          <input
            type="number"
            value={settings.trailLength}
            onChange={(e) =>
              setSettings({ ...settings, trailLength: parseInt(e.target.value, 10) })
            }
          />
        </label>
      </div>
    </div>
  );
};

export default ThreeScene;


