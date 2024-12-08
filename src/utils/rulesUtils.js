import { mulberry32 } from "./randomUtils";

export function generateColorsFromNonce(nonce, numColors) {
  const rand = mulberry32(nonce);
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    const hue = Math.round(rand() * 360);
    const saturation = 70; // Fixed saturation
    const lightness = 50; // Fixed lightness
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}

export function generateRules(colors, nonce) {
  const rand = mulberry32(nonce);
  const rules = {};
  colors.forEach((color) => {
    rules[color] = {};
    colors.forEach((targetColor) => {
      rules[color][targetColor] = rand() * 2 - 1; // Random value between -1 and 1
    });
  });
  return rules;
}

export const flattenRules = (rules, colors) => {
  return colors.map((sourceColor) =>
    colors.map((targetColor) => rules[sourceColor][targetColor] || 0)
  );
};
