import React, { useEffect } from 'react';
import GUI from 'lil-gui';

const SettingsGUI = ({ settings, updateSettings }) => {
  useEffect(() => {
    const gui = new GUI();

    try {
      gui.add(settings, 'atomsPerColor', 1, 1000, 1).name('Atoms Per Color').onChange((value) => {
        updateSettings({ atomsPerColor: value });
      });

      gui.add(settings, 'dimensions', 200, 2000, 50).name('Scene Dimensions').onChange((value) => {
        updateSettings({ dimensions: value });
      });

      gui.add(settings, 'timeScale', 0.1, 5.0, 0.1).name('Time Scale').onChange((value) => {
        updateSettings({ timeScale: value });
      });

      gui.add(settings, 'viscosity', 0.1, 2.0, 0.1).name('Viscosity').onChange((value) => {
        updateSettings({ viscosity: value });
      });

      gui.add(settings, 'cutOff', 1000, 20000, 500).name('Interaction Cutoff').onChange((value) => {
        updateSettings({ cutOff: value });
      });

      gui.add(settings, 'collisionRadius', 0.01, 1.0, 0.01).name('Collision Radius').onChange((value) => {
        updateSettings({ collisionRadius: value });
      });

      gui.add(settings, 'oscillationAmplitude', 0.01, 1.0, 0.01).name('Oscillation Amplitude').onChange((value) => {
        updateSettings({ oscillationAmplitude: value });
      });

      gui.add(settings, 'oscillationFrequency', 0.001, 0.1, 0.001).name('Oscillation Frequency').onChange((value) => {
        updateSettings({ oscillationFrequency: value });
      });

      gui.add(settings, 'pulseDuration', 10, 200, 10).name('Pulse Duration').onChange((value) => {
        updateSettings({ pulseDuration: value });
      });

      // Display the rules array (read-only)
      const rulesFolder = gui.addFolder('Interaction Rules');
      settings.rulesArray.forEach((ruleSet, index) => {
        const colorFolder = rulesFolder.addFolder(`Color ${index + 1}`);
        ruleSet.forEach((rule, ruleIndex) => {
          colorFolder.add({ rule: rule.toFixed(5) }, 'rule').name(`R${index + 1}-${ruleIndex + 1}`).listen();
        });
      });
      rulesFolder.open();
    } catch (error) {
      console.error('Error adding GUI control:', error);
    }

    // Cleanup GUI on component unmount
    return () => gui.destroy();
  }, [settings, updateSettings]);

  return null;
};

export default SettingsGUI;