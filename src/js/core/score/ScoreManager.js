import { safeStorage } from '@js/utils/safeStorage.js';

export class ScoreManager {
  constructor() {
    console.log('[ScoreManager] 初始化');
    this.score = 0;
    this.highScores = safeStorage.get('highScores', []);
    console.log(`[ScoreManager] 加载历史最高分: ${this.highScores.join(', ')}`);
    this.onScoreChange = null;
  }

  increase(points) {
    const oldScore = this.score;
    this.score = Math.max(0, this.score + points); // 防止负分
    console.log(
      `[ScoreManager] 分数更新: ${oldScore} -> ${this.score} (${points > 0 ? '+' : ''}${points})`
    );
    this.onScoreChange?.(this.score);
  }

  reset() {
    console.log('[ScoreManager] 重置分数');
    this.score = 0;
    this.onScoreChange?.(this.score);
  }

  getScore() {
    return this.score;
  }

  saveHighScore() {
    console.log(`[ScoreManager] 保存高分: ${this.score}`);
    this.highScores.push(this.score);
    this.highScores.sort((a, b) => b - a);
    this.highScores = this.highScores.slice(0, 5);
    console.log(
      `[ScoreManager] 更新后的高分排行: ${this.highScores.join(', ')}`
    );
    safeStorage.set('highScores', this.highScores);
  }
}
