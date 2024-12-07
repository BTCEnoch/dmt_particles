import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { fetchBlockData } from "../services/blockDataService";
import { mulberry32, generateColorsFromNonce } from "../utils/randomUtils";

const ThreeScene = ({ settings, blockData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const atomsRef = useRef([]);
  const timeRef = useRef(0);
  const polarityFactorRef = useRef(1);

  // Initialize particles
  const initializeParticles = () => {
    const atoms = [];
    const scene = sceneRef.current;

    for (let i = 0; i < settings.numParticles; i++) {
      const colorIndex = Math.floor(Math.random() * settings.colors.length);
      const color = settings.colors[colorIndex];

      const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
      const geometry = new THREE.SphereGeometry(5); // Particle size
      const particle = new THREE.Mesh(geometry, material);

      particle.position.set(
        Math.random() * settings.dimensions - settings.dimensions / 2,
        Math.random() * settings.dimensions - settings.dimensions / 2,
        Math.random() * settings.dimensions - settings.dimensions / 2
      );

      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );

      particle.colorIndex = colorIndex;
      scene.add(particle);
      atoms.push(particle);
    }
    atomsRef.current = atoms;
  };

  // Assign rules based on colors and nonce
  const assignForce = () => {
    const random = mulberry32(settings.nonce);

    settings.colors = generateColorsFromNonce(settings.nonce, settings.numParticles);

    if (!settings.colors || settings.colors.length === 0) {
      console.error("Colors array is empty or not defined.");
      return;
    }

    settings.rules = {};
    settings.colors.forEach((color) => {
      settings.rules[color] = {};
      settings.colors.forEach((targetColor) => {
        settings.rules[color][targetColor] = random() * 2 - 1; // Random values between -1 and 1
      });
    });

    flattenRules();
    console.log("Assigned rules:", settings.rules);
  };

  // Flatten rules for faster access
  const flattenRules = () => {
    settings.rulesArray = [];
    for (let i = 0; i < settings.colors.length; i++) {
      const ruleRow = [];
      for (let j = 0; j < settings.colors.length; j++) {
        ruleRow.push(settings.rules[settings.colors[i]][settings.colors[j]]);
      }
      settings.rulesArray.push(ruleRow);
    }
    console.log("Flattened rules:", settings.rulesArray);
  };

  // Apply interaction rules to particles
  const applyRules = () => {
    let totalVelocity = 0.0;
    const atoms = atomsRef.current;

    atoms.forEach((a) => {
      let fx = 0,
        fy = 0,
        fz = 0;

      atoms.forEach((b) => {
        if (a !== b) {
          const dx = a.position.x - b.position.x;
          const dy = a.position.y - b.position.y;
          const dz = a.position.z - b.position.z;
          const distanceSquared = dx * dx + dy * dy + dz * dz;

          if (distanceSquared < settings.cutOff * settings.cutOff) {
            const distance = Math.sqrt(distanceSquared);
            const g =
              settings.rulesArray[a.colorIndex][b.colorIndex] +
              settings.oscillationAmplitude *
                Math.sin(timeRef.current * settings.oscillationFrequency);
            const force = (g / distance) * polarityFactorRef.current;

            fx += force * dx;
            fy += force * dy;
            fz += force * dz;
          }
        }
      });

      a.velocity.x = a.velocity.x * (1 - settings.viscosity) + fx * settings.timeScale;
      a.velocity.y = a.velocity.y * (1 - settings.viscosity) + fy * settings.timeScale;
      a.velocity.z = a.velocity.z * (1 - settings.viscosity) + fz * settings.timeScale;

      totalVelocity += Math.abs(a.velocity.x) + Math.abs(a.velocity.y) + Math.abs(a.velocity.z);
    });

    atoms.forEach((a) => {
      a.position.x += a.velocity.x;
      a.position.y += a.velocity.y;
      a.position.z += a.velocity.z;
    });

    timeRef.current += 1;
    console.log("Total Velocity:", totalVelocity);
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      console.error("Container not found.");
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(400, 400, 400);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    // Animation loop
    const animate = () => {
      applyRules();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Handle block data updates
  useEffect(() => {
    if (blockData) {
      settings.nonce = blockData.nonce;
      assignForce();
      initializeParticles();
    }
  }, [blockData]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
};

export default ThreeScene;

