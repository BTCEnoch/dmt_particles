export function generateRules(colors, seed) {
    const rand = mulberry32(seed);
    const rules = {};
    colors.forEach((color) => {
        rules[color] = {};
        colors.forEach((targetColor) => {
            rules[color][targetColor] = rand() * 2 - 1; // Values between -1 and 1
        });
    });
    return rules;
}

export function flattenRules(rules, colors) {
    const rulesArray = [];
    colors.forEach((color) => {
        const row = colors.map((targetColor) => rules[color][targetColor] || 0);
        rulesArray.push(row);
    });
    return rulesArray;
}

export function applyForces(particles, rulesArray, cutoffDistance, timeScale, viscosity) {
    particles.forEach((particleA) => {
        let fx = 0, fy = 0, fz = 0;
        particles.forEach((particleB) => {
            if (particleA !== particleB) {
                const dx = particleA.position.x - particleB.position.x;
                const dy = particleA.position.y - particleB.position.y;
                const dz = particleA.position.z - particleB.position.z;
                const distanceSquared = dx * dx + dy * dy + dz * dz;

                if (distanceSquared > 0 && distanceSquared < cutoffDistance * cutoffDistance) {
                    const distance = Math.sqrt(distanceSquared);
                    const force =
                        (rulesArray[particleA.colorIndex][particleB.colorIndex] || 0) / distance;
                    fx += force * dx;
                    fy += force * dy;
                    fz += force * dz;
                }
            }
        });

        // Update velocity with viscosity and time scale
        particleA.vx = particleA.vx * (1 - viscosity) + fx * timeScale;
        particleA.vy = particleA.vy * (1 - viscosity) + fy * timeScale;
        particleA.vz = particleA.vz * (1 - viscosity) + fz * timeScale;
    });

    // Update positions based on velocity
    particles.forEach((particle) => {
        particle.position.x += particle.vx;
        particle.position.y += particle.vy;
        particle.position.z += particle.vz;
    });
}

export function applyOscillation(particles, amplitude, frequency, time) {
    particles.forEach((particle) => {
        const oscillation = amplitude * Math.sin(time * frequency);
        particle.vx += oscillation;
        particle.vy += oscillation;
        particle.vz += oscillation;
    });
}

export function handleCollisions(particles, collisionRadius) {
    const collisionRadiusSquared = collisionRadius * collisionRadius;

    particles.forEach((particleA) => {
        particles.forEach((particleB) => {
            if (particleA !== particleB) {
                const dx = particleA.position.x - particleB.position.x;
                const dy = particleA.position.y - particleB.position.y;
                const dz = particleA.position.z - particleB.position.z;
                const distanceSquared = dx * dx + dy * dy + dz * dz;

                if (distanceSquared > 0 && distanceSquared < collisionRadiusSquared) {
                    const distance = Math.sqrt(distanceSquared);
                    const overlap = collisionRadius - distance;
                    const nx = dx / distance;
                    const ny = dy / distance;
                    const nz = dz / distance;

                    particleA.vx += overlap * nx;
                    particleA.vy += overlap * ny;
                    particleA.vz += overlap * nz;
                }
            }
        });
    });
}

export function updateParticleStates(
    particles,
    rulesArray,
    cutoffDistance,
    timeScale,
    viscosity,
    collisionRadius,
    time,
    oscillationAmplitude = 0,
    oscillationFrequency = 0
) {
    applyForces(particles, rulesArray, cutoffDistance, timeScale, viscosity);
    if (oscillationAmplitude > 0 && oscillationFrequency > 0) {
        applyOscillation(particles, oscillationAmplitude, oscillationFrequency, time);
    }
    handleCollisions(particles, collisionRadius);
}
