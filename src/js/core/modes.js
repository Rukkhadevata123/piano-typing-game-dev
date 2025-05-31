import { gameConfig } from '@js/config/gameConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class ModeManager {
  constructor() {
    this.modes = gameConfig.modes;
    this.currentModeIndex = parseInt(safeStorage.get('currentMode', '0'));

    // 验证模式索引有效性
    if (this.currentModeIndex >= this.modes.length) {
      this.currentModeIndex = 0;
    }
  }

  switchMode() {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    safeStorage.set('currentMode', this.currentModeIndex);
    return this.getCurrentMode();
  }

  getCurrentMode() {
    return this.modes[this.currentModeIndex];
  }

  isRowMode() {
    return this.getCurrentMode().type === 'row';
  }

  getModeName() {
    return this.getCurrentMode().name;
  }
}
