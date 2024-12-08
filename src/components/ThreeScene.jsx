import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = ({ settings, blockData }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  // Atoms structure: [x, y, z, vx, vy, vz, colorIndex, mesh]
  const atomsRef = useRef([]);
  const timeRef = useRef(0);

  useEffect(() => {
    initializeScene();
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-generate atoms whenever relevant settings change
  useEffect(() => {
    createAtoms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.colors, settings.atomsPerColor, settings.dimensions, settings.rulesArray, settings.nonce]);

  const initializeScene = () => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000);
    camera.position.set(settings.dimensions * 2, settings.dimensions * 2, settings.dimensions * 2);
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

    // Optional Grid Helper
    const gridHelper = new THREE.GridHelper(settings.dimensions, 10);
    gridHelper.position.set(settings.dimensions / 2, 0, settings.dimensions / 2);
    scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Group to hold the atoms
    const atomsGroup = new THREE.Group();
    atomsGroup.name = "atomsGroup";
    scene.add(atomsGroup);

    animate();
  };

  const createAtoms = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear old atoms
    const oldGroup = scene.getObjectByName("atomsGroup");
    if (oldGroup) {
      while (oldGroup.children.length) {
        oldGroup.remove(oldGroup.children[0]);
      }
    }

    const atomsGroup = oldGroup || new THREE.Group();
    atomsGroup.name = "atomsGroup";

    // Create a basic geometry and material for each color
    const radius = 1; 
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const materials = settings.colors.map((c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c) }));

    // Distribute atoms among colors
    // settings.atomsPerColor is how many atoms per color
    const newAtoms = [];
    for (let cIndex = 0; cIndex < settings.colors.length; cIndex++) {
      for (let i = 0; i < settings.atomsPerColor; i++) {
        const mesh = new THREE.Mesh(geometry, materials[cIndex]);
        const x = Math.random() * settings.dimensions;
        const y = Math.random() * settings.dimensions;
        const z = Math.random() * settings.dimensions;
        mesh.position.set(x, y, z);
        atomsGroup.add(mesh);
        newAtoms.push([x, y, z, 0, 0, 0, cIndex, mesh]);
      }
    }

    scene.add(atomsGroup);
    atomsRef.current = newAtoms;
  };

  const applyRules = () => {
    const aData = atomsRef.current;
    const {
      timeScale,
      viscosity,
      cutOff,
      collisionRadius,
      oscillationAmplitude,
      oscillationFrequency,
      rulesArray,
      dimensions
    } = settings;

    let total_v = 0.0;
    const r2 = cutOff * cutOff;
    const collisionR2 = collisionRadius * collisionRadius;
    const polarityFactor = 1.0; // Adjust if needed

    for (let i = 0; i < aData.length; i++) {
      let fx = 0, fy = 0, fz = 0;
      const a = aData[i];
      for (let j = 0; j < aData.length; j++) {
        if (i === j) continue;
        const b = aData[j];
        let g = rulesArray[a[6]][b[6]];
        // Add oscillation as in original
        g += oscillationAmplitude * Math.sin(timeRef.current * oscillationFrequency);
        g *= polarityFactor;

        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        const dz = a[2] - b[2];
        const d = dx * dx + dy * dy + dz * dz;
        if (d < r2 && d > 0) {
          const dist = Math.sqrt(d);
          const F = g / dist;
          fx += F * dx;
          fy += F * dy;
          fz += F * dz;

          // Collision handling
          if (d < collisionR2) {
            const overlap = collisionRadius - dist;
            fx += (overlap * dx) / dist;
            fy += (overlap * dy) / dist;
            fz += (overlap * dz) / dist;
          }
        }
      }

      // Apply viscosity and time scale
      const vmix = 1.0 - viscosity;
      a[3] = a[3] * vmix + fx * timeScale;
      a[4] = a[4] * vmix + fy * timeScale;
      a[5] = a[5] * vmix + fz * timeScale;
      total_v += Math.abs(a[3]) + Math.abs(a[4]) + Math.abs(a[5]);
    }

    // Update positions and boundary checks
    for (let i = 0; i < aData.length; i++) {
      const a = aData[i];
      a[0] += a[3];
      a[1] += a[4];
      a[2] += a[5];

      if (a[0] < 0) {
        a[0] = -a[0];
        a[3] *= -1;
      }
      if (a[0] >= dimensions) {
        a[0] = 2 * dimensions - a[0];
        a[3] *= -1;
      }

      if (a[1] < 0) {
        a[1] = -a[1];
        a[4] *= -1;
      }
      if (a[1] >= dimensions) {
        a[1] = 2 * dimensions - a[1];
        a[4] *= -1;
      }

      if (a[2] < 0) {
        a[2] = -a[2];
        a[5] *= -1;
      }
      if (a[2] >= dimensions) {
        a[2] = 2 * dimensions - a[2];
        a[5] *= -1;
      }

      a[7].position.set(a[0], a[1], a[2]);
    }

    timeRef.current += 1;
  };

  const animate = () => {
    requestAnimationFrame(animate);
    applyRules();

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
};

export default ThreeScene;
