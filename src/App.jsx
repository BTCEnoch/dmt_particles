import React, { useState, useEffect } from 'react';
import ThreeScene from './components/ThreeScene';
import SettingsGUI from './components/SettingsGUI';
import { fetchBlockData } from './services/blockDataService';

const App = () => {
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

  useEffect(() => {
    const fetchAndSetBlockData = async () => {
      if (blockNumber > 0) {
        const data = await fetchBlockData(blockNumber);
        setBlockData(data);
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
      />
      <ThreeScene settings={settings} blockData={blockData} />
      <SettingsGUI settings={settings} updateSettings={(newSettings) => setSettings({ ...settings, ...newSettings })} />
    </>
  );
};

export default App;