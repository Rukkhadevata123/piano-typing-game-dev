import { gameConfig } from '@js/config/gameConfig.js';

export class DifficultyManager {
  constructor() {
    this.currentDifficulty = gameConfig.difficulty.initialRate;
  }

  randomizeDifficulty() {
    const { minRate, maxRate } = gameConfig.difficulty;
    this.currentDifficulty = minRate + Math.random() * (maxRate - minRate);
    return this.currentDifficulty;
  }

  getCurrentDifficulty() {
    return this.currentDifficulty;
  }

  reset() {
    this.currentDifficulty = gameConfig.difficulty.initialRate;
  }

  // 可选：随时间递增难度
  /*
   *   increaseDifficulty(score) {
   *       const { minRate, maxRate } = gameConfig.difficulty;
   *       this.currentDifficulty = Math.min(maxRate, minRate + score / 1000);
}
*/
}
