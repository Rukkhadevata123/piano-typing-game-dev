import { safeStorage } from '@js/utils/safeStorage.js';
import { ScoreCalculator } from '@js/core/score/ScoreCalculator.js';

export class ScoreManager {
  constructor() {
    console.log('[ScoreManager] 初始化');

    this.gameData = {
      score: 0,
      lastScoreDetails: null,
    };

    this.highScores = safeStorage.get('highScores', []);
    this.scoreCalculator = new ScoreCalculator();
    this.callbacks = { onScoreChange: null };

    console.log(`[ScoreManager] 加载历史最高分: ${this.highScores.join(', ')}`);
  }

  // === 主要接口 ===
  calculateScore(isHit, stats, timeLeft, totalTime) {
    const oldScore = this.gameData.score;
    const scoreDetails = this.scoreCalculator.calculate(
      isHit,
      stats,
      timeLeft,
      totalTime
    );

    this.gameData.score = Math.max(
      0,
      this.gameData.score + scoreDetails.points
    );
    this.gameData.lastScoreDetails = scoreDetails;

    console.log(
      `[ScoreManager] 分数更新: ${oldScore} -> ${this.gameData.score} ` +
        `(${scoreDetails.points > 0 ? '+' : ''}${scoreDetails.points}) [倍率: ${scoreDetails.multipliers.total}x]`
    );

    this.callbacks.onScoreChange?.(this.gameData.score, scoreDetails);
    return scoreDetails;
  }

  reset() {
    console.log('[ScoreManager] 重置分数');
    this.gameData.score = 0;
    this.gameData.lastScoreDetails = null;
    this.callbacks.onScoreChange?.(this.gameData.score);
  }

  saveHighScore() {
    console.log(`[ScoreManager] 保存高分: ${this.gameData.score}`);
    this.highScores.push(this.gameData.score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 5);

    console.log(
      `[ScoreManager] 更新后的高分排行: ${this.highScores.join(', ')}`
    );
    safeStorage.set('highScores', this.highScores);
  }

  // === 数据访问 ===
  getScore() {
    return this.gameData.score;
  }

  // === 事件回调 ===
  set onScoreChange(callback) {
    this.callbacks.onScoreChange = callback;
  }
}
