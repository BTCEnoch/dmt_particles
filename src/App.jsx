import React, { useState, useEffect } from "react";
import { fetchBlockData } from "./services/blockDataService";
import { generateColorsFromNonce, generateRules, flattenRules } from "./utils/rulesUtils";
import ThreeScene from "./components/ThreeScene";
import SettingsGUI from "./components/SettingsGUI";

const App = () => {
  const [blockNumber, setBlockNumber] = useState(0); // User-input block number
  const [blockData, setBlockData] = useState(null); // Fetched block data
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
    colors: ["#ff0000", "#00ff00", "#0000ff"], // Default colors
    rules: {},
    rulesArray: [],
    isReady: false, // Indicates if the app is ready for animation
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Fetch block data and generate settings based on the block number
  useEffect(() => {
    const fetchAndSetBlockData = async () => {
      if (blockNumber > 0) {
        console.log(`Fetching block data for block number: ${blockNumber}`);
        const data = await fetchBlockData(blockNumber);

        if (data) {
          const nonce = data.nonce || 0; // Get nonce from block data
          const colors = generateColorsFromNonce(nonce, 3); // Generate 3 colors based on nonce
          const rules = generateRules(colors, nonce); // Generate interaction rules
          const rulesArray = flattenRules(rules, colors); // Flatten rules into 2D array

          console.log("Fetched block data:", data);
          console.log("Generated colors:", colors);
          console.log("Generated rules array:", rulesArray);

          setBlockData(data);
          setSettings((prev) => ({
            ...prev,
            nonce,
            colors,
            rules,
            rulesArray,
            isReady: true, // Mark as ready
          }));
        }
      }
    };

    fetchAndSetBlockData();
  }, [blockNumber]);

  useEffect(() => {
    if (settings.isReady) {
      console.log("Settings are ready:", settings);
    }
  }, [settings.isReady]);

  // Ensure rules are updated when colors or nonce change
  useEffect(() => {
    if (settings.colors.length > 0 && settings.nonce !== undefined) {
      console.log("Updating interaction rules...");
      const rules = generateRules(settings.colors, settings.nonce); // Generate rules
      const rulesArray = flattenRules(rules, settings.colors); // Flatten rules
  
      console.log("Generated rules:", rules);
      console.log("Flattened rules array:", rulesArray);
  
      setSettings((prev) => ({
        ...prev,
        rules,
        rulesArray,
        isReady: true, // Mark as ready here
      }));
    }
  }, [settings.colors, settings.nonce]);

  return (
    <>
      {/* Block number input */}
      <input
        type="number"
        value={blockNumber}
        onChange={(e) => setBlockNumber(parseInt(e.target.value, 10) || 0)}
        placeholder="Enter block number"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 100 }}
      />

      {/* Three.js Scene */}
      <ThreeScene settings={settings} blockNumber={blockNumber} />


      {/* Settings GUI */}
      <SettingsGUI settings={settings} updateSettings={updateSettings} />
    </>
  );
};

export default App;
