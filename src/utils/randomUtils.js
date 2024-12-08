export function mulberry32(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  
  export function generateColorsFromNonce(nonce, numColors) {
    const rand = mulberry32(nonce);
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = Math.round(rand() * 360);
      const saturation = 80; // Fixed saturation percentage
      const lightness = 50; // Fixed lightness percentage
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    console.log("Generated Colors:", colors);
    return colors;
  }
  

export function assignRandomShapesToColors(colors) {
    const shapeTypes = ['sphere', 'box', 'cone', 'cylinder', 'torus'];
    const shapeMapping = {};
    colors.forEach((color) => {
        shapeMapping[color] = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    });
    return shapeMapping;
}

export function generateProportions(nonce, count) {
    const rand = mulberry32(nonce);
    const proportions = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
        const value = rand();
        proportions.push(value);
        total += value;
    }

    return proportions.map((p) => p / total);
}

export function distributeParticles(totalParticles, proportions) {
    const counts = proportions.map((p) => Math.round(p * totalParticles));

    const totalAssigned = counts.reduce((sum, count) => sum + count, 0);
    counts[counts.length - 1] += totalParticles - totalAssigned;

    return counts;
}

export function generateRandomPosition(cubeSize) {
    return {
        x: Math.random() * cubeSize - cubeSize / 2,
        y: Math.random() * cubeSize - cubeSize / 2,
        z: Math.random() * cubeSize - cubeSize / 2,
    };
}

export function generateRandomPositionInSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = radius * Math.cbrt(Math.random());
    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
    };
}

export function brightenColor(color, factor) {
    const rgb = new THREE.Color(color);
    rgb.multiplyScalar(factor);
    return `#${rgb.getHexString()}`;
}

export function generateShapesFromNonce(nonce, numShapes) {
    const rand = mulberry32(nonce);
    const shapeTypes = ['sphere', 'box', 'cone', 'cylinder', 'dodecahedron', 'icosahedron', 'torus'];
    return Array(numShapes)
        .fill()
        .map(() => shapeTypes[Math.floor(rand() * shapeTypes.length)]);
}

export function shuffleArray(array, rand) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

  