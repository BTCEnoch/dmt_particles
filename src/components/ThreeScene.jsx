import React, { useState, useEffect, useRef } from 'react';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { generateColorsFromNonce, generateRules, flattenRules } from "../utils/rulesUtils";
import { fetchBlockData } from "../services/blockDataService";
import PropTypes from 'prop-types';


const defaultSettings = {
  dimensions: 800,
  atomsPerColor: 250,
  timeScale: 0.8,
  viscosity: 1.0,
  cutOff: 18100,
  colors: ["#ff0000", "#00ff00", "#0000ff"],
  rules: {},
  rulesArray: [],
  isReady: false
};

const ThreeScene = ({ settings, blockNumber, setBlockNumber, updateSettings }) => {
  const isMounted = useRef(true);
  const previousBlockNumber = useRef(blockNumber);
  const isInitialMount = useRef(true);

  // Refs
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const atomsRef = useRef([]);
  const instancedMeshRef = useRef(null);



  const applyRules = () => {
    if (!settings.isReady || !instancedMeshRef.current) {
      console.log("Skipping rules application. Settings are not ready or instanced mesh is missing.");
      return;
    }

    const { timeScale, viscosity, cutOff, rulesArray, dimensions } = settings;
    const atoms = atomsRef.current;
    const cutoffSquared = cutOff * cutOff;

    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i];
      let fx = 0,
        fy = 0,
        fz = 0;

      for (let j = 0; j < atoms.length; j++) {
        if (i === j) continue;

        const b = atoms[j];
        const interactionForce = rulesArray[a[6]][b[6]];

        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        const distanceSquared = dx * dx + dy * dy + dz * dz;

        if (distanceSquared < cutoffSquared && distanceSquared > 0) {
          const distance = Math.sqrt(distanceSquared);
          const force = (interactionForce / distance) * timeScale;

          fx += force * dx;
          fy += force * dy;
          fz += force * dz;
        }
      }

      a[3] = a[3] * viscosity + fx;
      a[4] = a[4] * viscosity + fy;
      a[5] = a[5] * viscosity + fz;
    }

    const dummy = new THREE.Object3D();
    for (let i = 0; i < atoms.length; i++) {
      const a = atoms[i];
      a[0] += a[3];
      a[1] += a[4];
      a[2] += a[5];

      if (a[0] < 0 || a[0] > dimensions) a[3] *= -1;
      if (a[1] < 0 || a[1] > dimensions) a[4] *= -1;
      if (a[2] < 0 || a[2] > dimensions) a[5] *= -1;

      dummy.position.set(a[0], a[1], a[2]);
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(a[7], dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  };

  const initializeScene = () => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000);
    camera.position.set(
      settings.dimensions * 1.5,
      settings.dimensions * 1.5,
      settings.dimensions * 1.5
    );
    camera.lookAt(
      new THREE.Vector3(
        settings.dimensions / 2,
        settings.dimensions / 2,
        settings.dimensions / 2
      )
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(
      settings.dimensions / 2,
      settings.dimensions / 2,
      settings.dimensions / 2
    );
    controls.update();

    addLights();
    updateCubeOutline();
    animate();
  };

  const addLights = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    sceneRef.current.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(
      settings.dimensions / 2,
      settings.dimensions / 2,
      settings.dimensions * 1.5
    );
    sceneRef.current.add(pointLight);
  };

  const updateCubeOutline = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    const oldOutline = scene.getObjectByName("cubeOutline");
    if (oldOutline) scene.remove(oldOutline);

    const cubeGeometry = new THREE.BoxGeometry(
      settings.dimensions,
      settings.dimensions,
      settings.dimensions
    );
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const cubeOutline = new THREE.LineSegments(edges, outlineMaterial);
    cubeOutline.name = "cubeOutline";
    cubeOutline.position.set(
      settings.dimensions / 2,
      settings.dimensions / 2,
      settings.dimensions / 2
    );
    scene.add(cubeOutline);
  };

  const createAtoms = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
    }

    const numParticles = settings.atomsPerColor * settings.colors.length;
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const instancedMesh = new THREE.InstancedMesh(geometry, material, numParticles);

    const dummy = new THREE.Object3D();
    const newAtoms = [];

    let index = 0;
    settings.colors.forEach((color, colorIndex) => {
      material.color.set(color);
      for (let i = 0; i < settings.atomsPerColor; i++) {
        const x = Math.random() * settings.dimensions;
        const y = Math.random() * settings.dimensions;
        const z = Math.random() * settings.dimensions;

        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);

        newAtoms.push([x, y, z, 0, 0, 0, colorIndex, index]);
        index++;
      }
    });

    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;
    atomsRef.current = newAtoms;
  };

  const animate = () => {
    if (!settings.isReady) {
      console.log("Skipping animation loop until settings are ready.");
      return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
    applyRules();

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  };

  useEffect(() => {
    const initializeDefaultSettings = async () => {
      if (blockNumber === undefined) {
        const initialColors = generateColorsFromNonce(0, 3);
        const initialRules = generateRules(initialColors, 0);
        const initialRulesArray = flattenRules(initialRules, initialColors);
        
        updateSettings({
          ...defaultSettings,
          colors: initialColors,
          rules: initialRules,
          rulesArray: initialRulesArray,
          isReady: true
        });
      }
    };

    initializeDefaultSettings();
  }, []);  

  useEffect(() => {
    if (settings.isReady) {
      createAtoms();
      updateCubeOutline();
    }
  }, [settings]);

  useEffect(() => {
    initializeScene();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    createAtoms();
    updateCubeOutline();
  }, [settings.colors, settings.atomsPerColor, settings.dimensions]);

  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip if same block number
    if (blockNumber === previousBlockNumber.current) {
      return;
    }

    previousBlockNumber.current = blockNumber;

    const fetchAndSetBlockData = async () => {
      if (blockNumber > 0 && isMounted.current) {
        try {
          const data = await fetchBlockData(blockNumber);
          if (!data || !isMounted.current) return;

          const nonce = data.nonce || 0;
          const colors = generateColorsFromNonce(nonce, 3);
          const rules = generateRules(colors, nonce);
          const rulesArray = flattenRules(rules, colors);

          updateSettings(prev => ({
            ...prev,
            colors,
            rules,
            rulesArray,
            isReady: true,
            nonce
          }));
        } catch (error) {
          console.error('Error fetching block data:', error);
        }
      }
    };

    fetchAndSetBlockData();

    return () => {
      isMounted.current = false;
    };
  }, [blockNumber]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  if (!settings.isReady) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
}

ThreeScene.propTypes = {
  settings: PropTypes.shape({
    dimensions: PropTypes.number.isRequired,
    atomsPerColor: PropTypes.number.isRequired,
    timeScale: PropTypes.number.isRequired,
    viscosity: PropTypes.number.isRequired,
    cutOff: PropTypes.number.isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    rules: PropTypes.object.isRequired,
    rulesArray: PropTypes.array.isRequired,
    isReady: PropTypes.bool.isRequired
  }).isRequired,
  blockNumber: PropTypes.number.isRequired,
  setBlockNumber: PropTypes.func.isRequired,
  updateSettings: PropTypes.func.isRequired
};

export default ThreeScene;





