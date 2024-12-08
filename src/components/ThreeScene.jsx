import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = ({ settings }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  const atomsRef = useRef([]);
  const instancedMeshRef = useRef(null);
  const timeRef = useRef(0);

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
    console.log("Creating atoms...");
    settings.colors.forEach((color, cIndex) => {
      console.log(`Color ${cIndex}: ${color}`);
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

  const animate = () => {
    requestAnimationFrame(animate);

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }

    timeRef.current += 0.01;
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  );
};

export default ThreeScene;



