import { gameState } from './GameState.js';
import { Level1 } from '../levels/Level1.js';
import { Level2 } from '../levels/Level2.js';
import { Level3 } from '../levels/Level3.js';
import { Level4 } from '../levels/Level4.js';
import { Level5 } from '../levels/Level5.js';
import { Level6 } from '../levels/Level6.js';
import { Level7 } from '../levels/Level7.js';
import { Level8 } from '../levels/Level8.js';
import { Level9 } from '../levels/Level9.js';
import { Level10 } from '../levels/Level10.js';
import { Level11 } from '../levels/Level11.js';

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
    
    // Clear any existing active level instance to avoid duplicate loops / canvas leaks
    this.unmountLevel();

    // Tiny delay to let CSS opacity transition happen
    setTimeout(() => {
      // Clear again just in case another mount happened in between
      this.unmountLevel();

      if (levelId === 1) {
        this.activeLevelInstance = new Level1(this.spokeContainer);
      } else if (levelId === 2) {
        this.activeLevelInstance = new Level2(this.spokeContainer);
      } else if (levelId === 3) {
        this.activeLevelInstance = new Level3(this.spokeContainer);
      } else if (levelId === 4) {
        this.activeLevelInstance = new Level4(this.spokeContainer);
      } else if (levelId === 5) {
        this.activeLevelInstance = new Level5(this.spokeContainer);
      } else if (levelId === 6) {
        this.activeLevelInstance = new Level6(this.spokeContainer);
      } else if (levelId === 7) {
        this.activeLevelInstance = new Level7(this.spokeContainer);
      } else if (levelId === 8) {
        this.activeLevelInstance = new Level8(this.spokeContainer);
      } else if (levelId === 9) {
        this.activeLevelInstance = new Level9(this.spokeContainer);
      } else if (levelId === 10) {
        this.activeLevelInstance = new Level10(this.spokeContainer);
      } else if (levelId === 11) {
        this.activeLevelInstance = new Level11(this.spokeContainer);
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
