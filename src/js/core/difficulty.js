import { gameConfig } from '@js/config/gameConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class DifficultyManager {
  constructor() {
    this.currentRate = gameConfig.difficulty.generation.initialRate;
    this.minRate = gameConfig.difficulty.generation.minRate;
    this.maxRate = gameConfig.difficulty.generation.maxRate;

    // 从存储中加载保存的难度
    const savedRate = safeStorage.get('difficultyRate');
    if (
      savedRate !== null &&
      savedRate >= this.minRate &&
      savedRate <= this.maxRate
    ) {
      this.currentRate = savedRate;
    }
  }

  getCurrentRate() {
    return this.currentRate;
  }

  randomizeDifficulty() {
    // 随机调整难度，变化幅度较小
    const variation = (Math.random() - 0.5) * 0.1; // ±5% 变化
    this.currentRate = Math.max(
      this.minRate,
      Math.min(this.maxRate, this.currentRate + variation)
    );

    // 保存当前难度
    safeStorage.set('difficultyRate', this.currentRate);
    return this.currentRate;
  }

  reset() {
    this.currentRate = gameConfig.difficulty.generation.initialRate;
    safeStorage.remove('difficultyRate');
  }
}
