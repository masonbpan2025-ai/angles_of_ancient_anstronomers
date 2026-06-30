class GameState {
  constructor() {
    this.unlockedLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    this.activeLevel = null;
    this.listeners = [];
    this.derivationStep = 0;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  unlockLevel(id) {
    if (!this.unlockedLevels.includes(id)) {
      this.unlockedLevels.push(id);
      this.notify();
    }
  }

  startLevel(id) {
    if (this.activeLevel === id) return;
    this.activeLevel = id;
    this.notify();
  }

  completeLevel(id) {
    this.activeLevel = null;
    this.unlockLevel(id + 1);
    this.notify();
  }
}

export const gameState = new GameState();
