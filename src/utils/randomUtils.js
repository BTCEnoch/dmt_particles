export function mulberry32(a) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }
  
  export function generateColorsFromNonce(nonce, numColors) {
    const rand = mulberry32(nonce);
    const colors = [];
    for (let i = 0; i < numColors; i++) {
      const hue = Math.round(rand() * 360);
      const saturation = 70; 
      const lightness = 50;
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  }
  
  