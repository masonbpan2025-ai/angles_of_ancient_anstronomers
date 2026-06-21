import '../style.css';
import { SolarSystem } from './hub/SolarSystem.js';
import { HubUI } from './ui/HubUI.js';
import { LevelUI } from './ui/LevelUI.js';
import { SceneManager } from './core/SceneManager.js';
import { gameState } from './core/GameState.js';

// Entry Point
document.addEventListener('DOMContentLoaded', () => {
  const hubContainer = document.getElementById('hub-container');
  const uiLayer = document.getElementById('ui-layer');

  // Initialize 3D Hub
  const solarSystem = new SolarSystem(hubContainer);
  solarSystem.animate(performance.now());

  // Initialize UIs
  const hubUI = new HubUI(
    uiLayer, 
    (levelId) => {
      gameState.startLevel(levelId);
    },
    (target) => {
      solarSystem.setFocusTarget(target);
    },
    (controlName, value) => {
      solarSystem.updateControl(controlName, value);
    }
  );
  
  const levelUI = new LevelUI(uiLayer);

  // Initialize Scene Manager
  const sceneManager = new SceneManager(solarSystem, hubUI, levelUI);
});
