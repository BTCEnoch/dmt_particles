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

  const [blockNumber, setBlockNumber] = useState(0); // State for block number
  const [blockData, setBlockData] = useState(null); // State for fetched block data
  const [showParticles, setShowParticles] = useState(true); // Toggle particle visibility
  const [fps, setFps] = useState(0); // Track FPS

  // Fetch block data whenever blockNumber changes
  useEffect(() => {
    const fetchAndSetBlockData = async () => {
      try {
        const data = await fetchBlockData(blockNumber);
        if (data) {
          setBlockData(data);
        } else {
          console.warn(`No data returned for block number: ${blockNumber}`);
          setBlockData(null);
        }
      } catch (error) {
        console.error(`Error fetching block data for block ${blockNumber}:`, error);
        setBlockData(null);
      }
    };

    if (blockNumber > 0) {
      fetchAndSetBlockData();
    }
  }, [blockNumber]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings({
      dimensions: 800,
      numParticles: 100,
      timeScale: 1.0,
      viscosity: 0.5,
      collisionRadius: 10,
      oscillationAmplitude: 0.05,
      oscillationFrequency: 0.01,
    });
  };

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
      <label style={{ position: 'absolute', top: '40px', left: '10px', zIndex: 100 }}>
        <input
          type="checkbox"
          checked={showParticles}
          onChange={() => setShowParticles((prev) => !prev)}
        />
        Show Particles
      </label>
      <div
        style={{
          position: 'absolute',
          top: '70px',
          left: '10px',
          zIndex: 100,
          color: '#fff',
          fontSize: '16px',
        }}
      >
        FPS: {fps}
      </div>
      <ThreeScene settings={settings} blockData={blockData} showParticles={showParticles} setFps={setFps} />
      <SettingsGUI settings={settings} updateSettings={updateSettings} resetSettings={resetSettings} />
    </>
  );
};

export default App;