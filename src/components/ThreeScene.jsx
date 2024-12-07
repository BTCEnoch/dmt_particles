import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { generateColorsFromNonce } from '../utils/randomUtils';
import { generateRules, flattenRules, applyForces } from '../utils/rulesUtils';

const ThreeScene = ({ settings, blockData }) => {
    const containerRef = useRef(null);

    const createParticles = (numParticles, dimensions, scene, colors) => {
        const particlesGroup = new THREE.Group();
        colors.forEach((color, index) => {
            for (let i = 0; i < numParticles / colors.length; i++) {
                const particle = new THREE.Mesh(
                    new THREE.SphereGeometry(2),
                    new THREE.MeshBasicMaterial({ color: new THREE.Color(color) })
                );
                particle.position.set(
                    Math.random() * dimensions - dimensions / 2,
                    Math.random() * dimensions - dimensions / 2,
                    Math.random() * dimensions - dimensions / 2
                );
                particle.userData = {
                    vx: Math.random() * 2 - 1,
                    vy: Math.random() * 2 - 1,
                    vz: Math.random() * 2 - 1,
                    colorIndex: index,
                };
                particlesGroup.add(particle);
            }
        });
        scene.add(particlesGroup);
        return particlesGroup;
    };

    const updateParticles = (particlesGroup, dimensions, rulesArray) => {
        const particles = particlesGroup.children;

        applyForces(particles, rulesArray, dimensions, 0.1, 0.05);
        particles.forEach((particle) => {
            particle.position.x += particle.userData.vx;
            particle.position.y += particle.userData.vy;
            particle.position.z += particle.userData.vz;

            if (Math.abs(particle.position.x) > dimensions / 2) particle.userData.vx *= -1;
            if (Math.abs(particle.position.y) > dimensions / 2) particle.userData.vy *= -1;
            if (Math.abs(particle.position.z) > dimensions / 2) particle.userData.vz *= -1;
        });
    };

    useEffect(() => {
        const container = containerRef.current;
        const dimensions = settings.dimensions;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            2000
        );
        camera.position.set(500, 500, 500);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.update();

        const colors = generateColorsFromNonce(blockData?.nonce || 0, 5);
        const rules = generateRules(colors, blockData?.nonce || 0);
        const rulesArray = flattenRules(rules, colors);

        const particlesGroup = createParticles(settings.numParticles, dimensions, scene, colors);

        const animate = () => {
            updateParticles(particlesGroup, dimensions, rulesArray);
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            renderer.dispose();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, [settings, blockData]);

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeScene;