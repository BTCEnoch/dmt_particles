import { mulberry32 } from "./randomUtils";

export function generateRules(colors, seed) {
  const rand = mulberry32(seed);
  const rules = {};
  colors.forEach((color) => {
    rules[color] = {};
    colors.forEach((targetColor) => {
      rules[color][targetColor] = rand() * 2 - 1; // Random values between -1 and 1
    });
  });
  console.log("Generated Rules:", rules);
  return rules;
}

export const flattenRules = (rules, colors) => {
    const rulesArray = [];
    colors.forEach((color) => {
      const row = colors.map((targetColor) => rules[color]?.[targetColor] || 0);
      rulesArray.push(row);
    });
    console.log("Flattened rules array:", rulesArray);
    return rulesArray;
  };

