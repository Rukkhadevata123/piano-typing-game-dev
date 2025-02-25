export class StatsManager {
  constructor() {
    this.totalHits = 0;
    this.totalMisses = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.startTime = Date.now();
    this.onStatsChange = null;
  }

  update(isHit) {
    this.totalHits += isHit ? 1 : 0;
    this.totalMisses += isHit ? 0 : 1;
    this.currentCombo = isHit ? this.currentCombo + 1 : 0;
    this.maxCombo = Math.max(this.maxCombo, this.currentCombo);
    this.onStatsChange?.();
  }

  reset() {
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
    return {
      accuracy,
      cps,
      maxCombo: this.maxCombo,
      currentCombo: this.currentCombo,
    };
  }
}
