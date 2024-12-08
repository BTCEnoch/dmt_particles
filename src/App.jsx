import React, { useState, useEffect } from "react";
import { fetchBlockData } from "./services/blockDataService";
import { generateColorsFromNonce, generateRules, flattenRules } from "./utils/rulesUtils";
import ThreeScene from "./components/ThreeScene";
import SettingsGUI from "./components/SettingsGUI";
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
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
    colors: ["#ff0000", "#00ff00", "#0000ff"],
    rules: {},
    rulesArray: [],
    isReady: false
  });

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    const fetchAndUpdateBlockData = async () => {
      if (blockNumber > 0) {
        console.log(`Fetching block data for block number: ${blockNumber}`);
        const data = await fetchBlockData(blockNumber);

        if (data) {
          const nonce = data.nonce || 0;
          const colors = generateColorsFromNonce(nonce, 3);
          const rules = generateRules(colors, nonce);
          const rulesArray = flattenRules(rules, colors);

          console.log("Fetched block data:", data);
          console.log("Generated colors:", colors);
          console.log("Generated rules array:", rulesArray);

          setBlockData(data);
          updateSettings({
            nonce,
            colors,
            rules,
            rulesArray,
            isReady: true
          });
        }
      } else {
        console.warn("Block number is not greater than 0. Skipping data fetch.");
      }
    };

    fetchAndUpdateBlockData();
  }, [blockNumber]);

  useEffect(() => {
    if (settings.isReady) {
      console.log("Settings are ready:", settings);
    }
  }, [settings.isReady]);

  useEffect(() => {
    console.log("Updated settings:", settings);
  }, [settings]);

  return (
    <div className="App">
      <input
        type="number"
        value={blockNumber}
        onChange={(e) => setBlockNumber(parseInt(e.target.value, 10) || 0)}
        placeholder="Enter block number"
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 100,
        }}
      />
      
      <ErrorBoundary>
        <ThreeScene 
          settings={settings}
          blockNumber={blockNumber}
          setBlockNumber={setBlockNumber}
          updateSettings={updateSettings}
        />
      </ErrorBoundary>

      <SettingsGUI 
        settings={settings} 
        updateSettings={updateSettings}
      />
    </div>
  );
}

export default App;