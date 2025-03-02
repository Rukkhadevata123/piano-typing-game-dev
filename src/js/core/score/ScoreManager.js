import { safeStorage } from '@js/utils/safeStorage.js';
import { ScoreCalculator } from '@js/core/score/ScoreCalculator.js';

export class ScoreManager {
  constructor() {
    console.log('[ScoreManager] 初始化');
    this.score = 0;
    this.scoreCalculator = new ScoreCalculator();
    this.highScores = safeStorage.get('highScores', []);
    console.log(`[ScoreManager] 加载历史最高分: ${this.highScores.join(', ')}`);
    this.onScoreChange = null;
    this.lastScoreDetails = null; // 保存上一次得分详情，用于UI显示
  }

  /**
   * 计算并增加得分
   * @param {boolean} isHit - 是否命中
   * @param {Object} stats - 游戏统计信息
   * @param {number} timeLeft - 剩余时间(秒)
   * @param {number} totalTime - 游戏总时间(秒)
   */
  calculateScore(isHit, stats, timeLeft, totalTime) {
    const oldScore = this.score;

    // 使用计算器获取详细得分
    const scoreDetails = this.scoreCalculator.calculate(
      isHit,
      stats,
      timeLeft,
      totalTime
    );

    // 更新总分
    this.score = Math.max(0, this.score + scoreDetails.points);

    // 保存得分详情
    this.lastScoreDetails = scoreDetails;

    console.log(
      `[ScoreManager] 分数更新: ${oldScore} -> ${this.score} (${scoreDetails.points > 0 ? '+' : ''}${scoreDetails.points}) [倍率: ${scoreDetails.multipliers.total}x]`
    );

    // 触发回调
    this.onScoreChange?.(this.score, scoreDetails);

    return scoreDetails;
  }

  getLastScoreDetails() {
    return this.lastScoreDetails;
  }
  reset() {
    console.log('[ScoreManager] 重置分数');
    this.score = 0;
    this.lastScoreDetails = null;
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
