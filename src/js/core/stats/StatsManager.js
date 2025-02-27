export class StatsManager {
  constructor() {
    console.log('[StatsManager] 初始化');
    this.totalHits = 0;
    this.totalMisses = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.startTime = Date.now();
    this.onStatsChange = null;
  }

  update(isHit) {
    console.log(`[StatsManager] 更新统计: isHit=${isHit}`);
    this.totalHits += isHit ? 1 : 0;
    this.totalMisses += isHit ? 0 : 1;

    // 更新连击数并记录日志
    const oldCombo = this.currentCombo;
    this.currentCombo = isHit ? this.currentCombo + 1 : 0;
    const oldMaxCombo = this.maxCombo;
    this.maxCombo = Math.max(this.maxCombo, this.currentCombo);

    console.log(`[StatsManager] 连击: ${oldCombo} -> ${this.currentCombo}`);
    if (this.maxCombo > oldMaxCombo) {
      console.log(`[StatsManager] 新的最大连击: ${this.maxCombo}`);
    }

    this.onStatsChange?.();
  }

  reset() {
    console.log('[StatsManager] 重置所有统计');
    this.totalHits = 0;
    this.totalMisses = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.startTime = Date.now();
    this.onStatsChange?.();
  }

  getStats() {
    const totalAttempts = this.totalHits + this.totalMisses;
    const accuracy =
      totalAttempts > 0
        ? Math.round((this.totalHits / totalAttempts) * 100)
        : 100;
    const playTime = (Date.now() - this.startTime) / 1000;
    const cps =
      playTime > 0 ? Math.round((this.totalHits / playTime) * 10) / 10 : 0;

    const result = {
      accuracy,
      cps,
      maxCombo: this.maxCombo,
      currentCombo: this.currentCombo,
    };

    console.log('[StatsManager] 获取统计:', result);
    return result;
  }
}
