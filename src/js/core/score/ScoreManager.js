import { safeStorage } from '@js/utils/safeStorage.js';

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.highScores = safeStorage.get('highScores', []);
    this.onScoreChange = null;
  }

  increase(points) {
    this.score = Math.max(0, this.score + points); // 防止负分
    this.onScoreChange?.(this.score);
  }

  reset() {
    this.score = 0;
    this.onScoreChange?.(this.score);
  }

  getScore() {
    return this.score;
  }

  saveHighScore() {
    this.highScores.push(this.score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 5);
    safeStorage.set('highScores', this.highScores);
  }
}
