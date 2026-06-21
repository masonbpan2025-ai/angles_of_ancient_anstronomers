import { gameState } from './GameState.js';
import { Level1 } from '../levels/Level1.js';
import { Level2 } from '../levels/Level2.js';

export class SceneManager {
  constructor(hub, hubUI, levelUI) {
    this.hub = hub;
    this.hubUI = hubUI;
    this.levelUI = levelUI;
    this.spokeContainer = document.getElementById('spoke-container');
    this.activeLevelInstance = null;

    gameState.subscribe((state) => {
      this.handleStateChange(state);
    });
  }

  handleStateChange(state) {
    if (state.activeLevel !== null) {
      // Transition from Hub to Spoke
      this.hubUI.hide();
      
      // Zoom camera to planet
      this.hub.focusOnPlanet(state.activeLevel, () => {
        this.mountLevel(state.activeLevel);
      });
      
    } else {
      // Transition from Spoke back to Hub
      this.unmountLevel();
      this.spokeContainer.classList.remove('active');
      this.hub.resume();
      this.hubUI.show();
    }
  }

  mountLevel(levelId) {
    this.hub.pause();
    this.spokeContainer.classList.add('active');
    
    // Tiny delay to let CSS opacity transition happen
    setTimeout(() => {
      if (levelId === 1) {
        this.activeLevelInstance = new Level1(this.spokeContainer);
      } else if (levelId === 2) {
        this.activeLevelInstance = new Level2(this.spokeContainer);
      }
      window.activeLevelInstance = this.activeLevelInstance;
      this.levelUI.show();
    }, 500);
  }

  unmountLevel() {
    if (this.activeLevelInstance) {
      this.activeLevelInstance.destroy();
      this.activeLevelInstance = null;
      window.activeLevelInstance = null;
    }
  }
}
