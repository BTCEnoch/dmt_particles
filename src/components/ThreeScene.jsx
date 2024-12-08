import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeScene = () => {
  const containerRef = useRef(null); // Reference for the HTML container
  const sceneRef = useRef(null); // Reference for the scene
  const cameraRef = useRef(null); // Reference for the camera
  const rendererRef = useRef(null); // Reference for the renderer
  const atomsRef = useRef([]); // Reference for the particles (atoms)
  
  const settings = {
    numParticles: 500, // Number of particles in the scene
    dimensions: 100, // Size of the cube containing particles
    colors: [0xff0000, 0x00ff00, 0x0000ff], // Red, Green, Blue colors for particles
  };

  // STEP 1: Initialize the scene, camera, and renderer
  const initializeScene = () => {
    const container = containerRef.current; // Get the HTML container
    if (!container) return;

    // 1. Create the scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Set background to black
    sceneRef.current = scene;

    // 2. Create the camera
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
      container.clientWidth / container.clientHeight, // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    camera.position.set(0, 120, 150); // Position the camera
    camera.lookAt(0, 0, 0); // Make the camera look at the center of the scene
    cameraRef.current = camera;

    // 3. Create the renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight); // Set the renderer size
    container.appendChild(renderer.domElement); // Attach the renderer to the DOM
    rendererRef.current = renderer;

    // 4. Add orbit controls for user interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Add damping for smooth movement
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0); // Focus on the center of the scene
    controls.update();

    // STEP 2: Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft ambient light
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1); // Point light for shading
    pointLight.position.set(50, 50, 50);
    scene.add(pointLight);

    // STEP 3: Add the cube outline (container)
    const boxGeometry = new THREE.BoxGeometry(
      settings.dimensions,
      settings.dimensions,
      settings.dimensions
    );
    const edgesGeometry = new THREE.EdgesGeometry(boxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff }); // Cyan outline
    const cubeOutline = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    scene.add(cubeOutline);

    // STEP 4: Add a floor (grid helper)
    const gridHelper = new THREE.GridHelper(settings.dimensions, 10);
    gridHelper.position.y = -settings.dimensions / 2; // Align grid with the bottom of the cube
    scene.add(gridHelper);
  };

  // STEP 5: Initialize particles (atoms)
  const initializeParticles = () => {
    const atoms = []; // Array to store particle details
    const { numParticles, dimensions, colors } = settings; // Destructure settings

    for (let i = 0; i < numParticles; i++) {
      // Create a random geometry (sphere or cube)
      const geometry =
        Math.random() > 0.5
          ? new THREE.SphereGeometry(Math.random() * 2 + 1, 16, 16) // Random sphere
          : new THREE.BoxGeometry(
              Math.random() * 2 + 1,
              Math.random() * 2 + 1,
              Math.random() * 2 + 1
            ); // Random cube

      // Assign a random color from settings.colors
      const colorIndex = Math.floor(Math.random() * colors.length);
      const material = new THREE.MeshStandardMaterial({
        color: colors[colorIndex],
        metalness: 0.5, // Adds metallic appearance
        roughness: 0.7, // Adjust roughness for realism
      });

      // Create the particle mesh
      const particle = new THREE.Mesh(geometry, material);

      // Randomly position the particle within the cube
      particle.position.set(
        Math.random() * dimensions - dimensions / 2,
        Math.random() * dimensions - dimensions / 2,
        Math.random() * dimensions - dimensions / 2
      );

      // Assign random velocity for movement
      particle.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2, // X-axis velocity
        (Math.random() - 0.5) * 2, // Y-axis velocity
        (Math.random() - 0.5) * 2 // Z-axis velocity
      );

      // Add the particle to the scene
      sceneRef.current.add(particle);

      // Save the particle in the atoms array
      atoms.push(particle);
    }

    // Save particles in a reference for animation
    atomsRef.current = atoms;
  };

  // STEP 6: Animate particles
  const animateParticles = () => {
    const atoms = atomsRef.current;
    const dimensions = settings.dimensions / 2;

    atoms.forEach((particle) => {
      // Update particle position based on velocity
      particle.position.add(particle.velocity);

      // Make particles bounce off the walls
      ["x", "y", "z"].forEach((axis) => {
        if (
          particle.position[axis] > dimensions ||
          particle.position[axis] < -dimensions
        ) {
          particle.velocity[axis] = -particle.velocity[axis]; // Reverse direction
        }
      });
    });
  };

  // STEP 7: Animate the scene
  const animate = () => {
    animateParticles(); // Update particle positions
    rendererRef.current.render(sceneRef.current, cameraRef.current); // Render the scene
    requestAnimationFrame(animate); // Call animate recursively
  };

  // STEP 8: Initialize and start the scene
  useEffect(() => {
    initializeScene();
    initializeParticles();
    animate();

    // Cleanup function to dispose of renderer on unmount
    return () => {
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default ThreeScene;





