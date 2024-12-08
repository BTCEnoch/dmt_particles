import React, { useState, useEffect } from "react";
import { fetchBlockData } from "./services/blockDataService";
import { generateColorsFromNonce, generateRules, flattenRules } from "./utils/rulesUtils";
import ThreeScene from "./components/ThreeScene";
import SettingsGUI from "./components/SettingsGUI";

const App = () => {
  const [blockNumber, setBlockNumber] = useState(0);
  const [blockData, setBlockData] = useState(null);
  const [settings, setSettings] = useState({
    dimensions: 800,
    atomsPerColor: 250,
    timeScale: 0.8,
    viscosity: 1.0,
    collisionRadius: 0.01,
    oscillationAmplitude: 0.05,
    oscillationFrequency: 0.01,
    cutOff: 18100,
    pulseDuration: 100,
    colors: [],
    rules: {},
    rulesArray: [],
    numColors: 5, // Number of colors
    nonce: 0,
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    const fetchAndSetBlockData = async () => {
      if (blockNumber > 0) {
        const data = await fetchBlockData(blockNumber);
        if (data) {
          const nonce = data.nonce || 0;
          const colors = generateColorsFromNonce(nonce, settings.numColors);
          const rules = generateRules(colors, nonce);
          const rulesArray = flattenRules(rules, colors);

          setBlockData(data);
          setSettings((prev) => ({
            ...prev,
            nonce,
            colors,
            rules,
            rulesArray,
          }));
        }
      }
    };
    fetchAndSetBlockData();
  }, [blockNumber]);

  return (
    <>
      <input
        type="number"
        value={blockNumber}
        onChange={(e) => setBlockNumber(parseInt(e.target.value, 10) || 0)}
        placeholder="Enter block number"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 100 }}
      />
      <ThreeScene settings={settings} />
      <SettingsGUI settings={settings} updateSettings={updateSettings} />
    </>
  );
};

export default App;