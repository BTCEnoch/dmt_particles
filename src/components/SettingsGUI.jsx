import React, { useEffect } from 'react';
import GUI from 'lil-gui';

const SettingsGUI = ({ settings, updateSettings }) => {
  useEffect(() => {
    const gui = new GUI();
    gui.add(settings, 'dimensions', 200, 2000, 100).name('Scene Dimensions');
    gui.add(settings, 'numParticles', 100, 2000, 100).name('Particles').onChange(() => updateSettings({}));
    gui.add(settings, 'timeScale', 0.1, 2, 0.1).name('Time Scale');
    gui.add(settings, 'viscosity', 0.1, 1, 0.05).name('Viscosity');
    return () => gui.destroy();
  }, [settings, updateSettings]);

  return null;
};

export default SettingsGUI;