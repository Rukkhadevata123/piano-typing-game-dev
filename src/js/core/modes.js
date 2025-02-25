import { gameConfig } from '@js/config/gameConfig.js';

export class ModeManager {
  constructor() {
    this.currentModeIndex = 0;
  }

  switchMode() {
    this.currentModeIndex =
      (this.currentModeIndex + 1) % gameConfig.modes.length;
    return this.getCurrentMode();
  }

  getCurrentMode() {
    return gameConfig.modes[this.currentModeIndex];
  }

  isRowMode() {
    return this.getCurrentMode().type === 'row';
  }

  getModeName() {
    return this.isRowMode() ? '整行' : '单块';
  }
}
