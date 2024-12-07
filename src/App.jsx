import React, { useState, useEffect } from 'react';
import ThreeScene from './components/ThreeScene';
import SettingsGUI from './components/SettingsGUI';
import { fetchBlockData } from './services/blockDataService';

const App = () => {
  console.log('App component has mounted or re-rendered'); // Debug for App lifecycle

  const [settings, setSettings] = useState({
    dimensions: 800,
    numParticles: 100,
    timeScale: 1.0,
    viscosity: 0.5,
    collisionRadius: 10,
    oscillationAmplitude: 0.05,
    oscillationFrequency: 0.01,
  });

  const [blockNumber, setBlockNumber] = useState(0);
  const [blockData, setBlockData] = useState(null);

  // Debug for block number changes
  useEffect(() => {
    console.log('Block number has changed:', blockNumber);
    const fetchAndSetBlockData = async () => {
      if (blockNumber > 0) {
        const data = await fetchBlockData(blockNumber);
        setBlockData(data);
        console.log('Fetched block data:', data); // Log fetched data
      }
    };
    fetchAndSetBlockData();
  }, [blockNumber]);

  // Debug for settings changes
  useEffect(() => {
    console.log('Settings updated:', settings);
  }, [settings]);

  return (
    <>
      <input
        type="number"
        value={blockNumber}
        onChange={(e) => setBlockNumber(parseInt(e.target.value, 10) || 0)}
        placeholder="Enter block number"
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 100,
          fontSize: '16px',
        }}
      />
      <ThreeScene
        settings={settings}
        blockData={blockData}
        debug
      />
      <SettingsGUI
        settings={settings}
        updateSettings={(newSettings) => {
          console.log('Updating settings via GUI:', newSettings);
          setSettings({ ...settings, ...newSettings });
        }}
      />
    </>
  );
};

export default App;