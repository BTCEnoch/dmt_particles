import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { generateRules, flattenRules } from "../utils/rulesUtils";


const ThreeScene = ({ settings, blockNumber, updateSettings }) => {
  console.log("Block Number in ThreeScene:", blockNumber);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  const atomsRef = useRef([]);
  const instancedMeshRef = useRef(null);
  const timeRef = useRef(0);

  const applyRules = () => {
    const { rulesArray } = settings;
  
    if (!rulesArray || rulesArray.length === 0) {
      console.warn("Interaction rules are not defined or empty.");
      return; // Skip applying rules if they are not initialized
    }
  
    if (!instancedMeshRef.current) {
      console.warn("Instanced mesh is not initialized yet.");
      return; // Skip applying rules if particles are not initialized
    }
  
    const aData = atomsRef.current;
    const { timeScale, viscosity, cutOff, dimensions } = settings;
    const r2 = cutOff * cutOff; // Squared cutoff distance for performance
  
    for (let i = 0; i < aData.length; i++) {
      let fx = 0,
        fy = 0,
        fz = 0; // Forces acting on particle `a`
      const a = aData[i];
  
      for (let j = 0; j < aData.length; j++) {
        if (i === j) continue; // Skip self-interaction
  
        const b = aData[j];
        const interactionForce = rulesArray[a[6]]?.[b[6]];
        if (interactionForce === undefined) continue; // Skip if no interaction rule is defined
  
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        const distanceSquared = dx * dx + dy * dy + dz * dz;
  
        if (distanceSquared < r2 && distanceSquared > 0) {
          const distance = Math.sqrt(distanceSquared);
          const force = (interactionForce / distance) * timeScale; // Force inversely proportional to distance
  
          fx += force * dx;
          fy += force * dy;
          fz += force * dz;
        }
      }
  
      // Apply forces and update velocities with viscosity
      a[3] = a[3] * viscosity + fx;
      a[4] = a[4] * viscosity + fy;
      a[5] = a[5] * viscosity + fz;
    }
  
    // Update positions and apply boundary conditions
    for (let i = 0; i < aData.length; i++) {
      const a = aData[i];
      a[0] += a[3];
      a[1] += a[4];
      a[2] += a[5];
  
      // Boundary collisions (bouncing particles)
      if (a[0] < 0 || a[0] > dimensions) a[3] *= -1;
      if (a[1] < 0 || a[1] > dimensions) a[4] *= -1;
      if (a[2] < 0 || a[2] > dimensions) a[5] *= -1;
  
      // Update particle position in instanced mesh
      const dummy = new THREE.Object3D();
      dummy.position.set(a[0], a[1], a[2]);
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(a[7], dummy.matrix);
    }
  
    instancedMeshRef.current.instanceMatrix.needsUpdate = true; // Update the instanced mesh
  };
  

  useEffect(() => {
    initializeScene();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    console.log("Settings updated:", settings);
    createAtoms();
    updateCubeOutline();
  }, [settings.colors, settings.atomsPerColor, settings.dimensions]);

  const animate = () => {
    if (!settings.isReady) {
      console.warn("Skipping animation loop until settings are ready.");
      requestAnimationFrame(animate);
      return;
    }
  
    console.log("Animation loop running...");
  
    applyRules(); // Update particle positions based on interactions
  
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
  
    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  
    requestAnimationFrame(animate); // Continue the animation loop
  };
  
  const initializeScene = () => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000);
    camera.position.set(settings.dimensions * 1.5, settings.dimensions * 1.5, settings.dimensions * 1.5);
    camera.lookAt(new THREE.Vector3(settings.dimensions / 2, settings.dimensions / 2, settings.dimensions / 2));
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(settings.dimensions / 2, settings.dimensions / 2, settings.dimensions / 2);
    controls.update();

    addLights();
    updateCubeOutline();

    animate();
  };

  const addLights = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    sceneRef.current.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(settings.dimensions / 2, settings.dimensions / 2, settings.dimensions * 1.5);
    sceneRef.current.add(pointLight);
  };

  const updateCubeOutline = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldOutline = scene.getObjectByName("cubeOutline");
    if (oldOutline) scene.remove(oldOutline);

    const cubeGeometry = new THREE.BoxGeometry(settings.dimensions, settings.dimensions, settings.dimensions);
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const cubeOutline = new THREE.LineSegments(edges, outlineMaterial);
    cubeOutline.name = "cubeOutline";
    cubeOutline.position.set(settings.dimensions / 2, settings.dimensions / 2, settings.dimensions / 2);
    scene.add(cubeOutline);
  };

  const createAtoms = () => {
    const scene = sceneRef.current;
    if (!scene) return;
  
    // Remove old particles
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
    }
  
    // Debugging settings
    console.log("Creating atoms with settings:", {
      colors: settings.colors,
      atomsPerColor: settings.atomsPerColor,
      dimensions: settings.dimensions,
    });
  
    if (!settings.colors || settings.colors.length === 0) {
      console.error("No colors provided in settings.colors.");
      return;
    }
  
    if (!settings.atomsPerColor || settings.atomsPerColor <= 0) {
      console.error("Invalid value for settings.atomsPerColor.");
      return;
    }
  
    const numParticles = settings.atomsPerColor * settings.colors.length;
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, numParticles);
  
    const dummy = new THREE.Object3D();
    const newAtoms = [];
  
    let index = 0;
    settings.colors.forEach((color, cIndex) => {
      console.log(`Creating particles for color ${cIndex}: ${color}`);
      material.color.set(color);
  
      for (let i = 0; i < settings.atomsPerColor; i++) {
        const x = Math.random() * settings.dimensions;
        const y = Math.random() * settings.dimensions;
        const z = Math.random() * settings.dimensions;
  
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
  
        newAtoms.push([x, y, z, 0, 0, 0, cIndex, index]);
        index++;
      }
    });
  
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
    atomsRef.current = newAtoms;
  
    console.log(`Created ${newAtoms.length} atoms.`);
  };
  


  useEffect(() => {
    if (settings.isReady) {
      console.log("Settings are ready, starting animation loop...");
      animate();
    }
  }, [settings.isReady]);

  useEffect(() => {
    updateSettings((prev) => ({
      ...prev,
      isReady: false, // Reset isReady
    }));
  }, [blockNumber]);

  console.log("Received Block Number in ThreeScene:", blockNumber);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
};

export default ThreeScene;



