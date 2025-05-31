import { gameConfig } from '@js/config/gameConfig.js';

export class ScoreCalculator {
  constructor() {
    // === 基础配置 ===
    this.BASE_POINTS = {
      hit: gameConfig.points.hit,
      miss: gameConfig.points.miss,
    };

    this.COMBO_MILESTONES = [
      25, 42, 50, 69, 75, 100, 150, 200, 250, 300, 350, 400, 404, 450, 500, 550,
      600, 650, 700, 750, 777, 800, 850, 900, 950, 1000,
    ];

    // === 计算参数 ===
    this.COMBO_PARAMS = {
      logBase: 0.35,
      penalty: {
        low: 0.35, // ≤10连击
        mid: 0.6, // 11-50连击
        high: 3, // >50连击
      },
    };

    this.MILESTONE_PARAMS = {
      baseBonus: 8,
      growthBase: 1.6,
      scaleCap: 4,
    };

    this.SCORE_LIMITS = {
      min: -80,
      max: 250,
    };
  }

  // === 主要计算接口 ===
  calculate(isHit, stats, timeLeft, totalTime) {
    const basePoints = this._getBasePoints(isHit);
    const multipliers = this._calculateMultipliers(stats, timeLeft, totalTime);
    let finalPoints = Math.round(basePoints * multipliers.total);

    const specials = this._calculateSpecialAdjustments(
      isHit,
      stats.currentCombo,
      finalPoints
    );
    finalPoints = this._clampPoints(specials.adjustedPoints);

    return {
      points: finalPoints,
      basePoints,
      multipliers: this._formatMultipliers(multipliers),
      details: {
        comboPenalty: specials.comboPenalty,
        milestoneBonus: specials.milestoneBonus,
      },
    };
  }

  // === 内部计算方法 ===
  _getBasePoints(isHit) {
    return isHit ? this.BASE_POINTS.hit : this.BASE_POINTS.miss;
  }

  _calculateMultipliers(stats, timeLeft, totalTime) {
    const { accuracy, cps, currentCombo } = stats;

    const combo = this._getComboMultiplier(currentCombo);
    const accuracyMult = 0.5 + accuracy / 100;
    const cpsBonus = Math.min(0.5, cps * 0.1);
    const timeLeftFactor = 1 + (1 - timeLeft / totalTime) * 0.5;

    const baseMultiplier = combo;
    const bonusFactor = accuracyMult - 1 + cpsBonus + (timeLeftFactor - 1);
    const total = Math.max(
      0.5,
      Math.min(4.5, baseMultiplier * (1 + bonusFactor * 0.5))
    );

    return {
      combo,
      accuracy: accuracyMult,
      cps: 1 + cpsBonus,
      timeLeft: timeLeftFactor,
      total,
    };
  }

  _calculateSpecialAdjustments(isHit, currentCombo, currentPoints) {
    let adjustedPoints = currentPoints;
    let comboPenalty = 0;
    let milestoneBonus = 0;

    if (!isHit && currentCombo > 5) {
      comboPenalty = this._getComboPenalty(currentCombo);
      adjustedPoints -= comboPenalty;
    }

    if (isHit) {
      milestoneBonus = this._getMilestoneBonus(currentCombo);
      adjustedPoints += milestoneBonus;
    }

    return { adjustedPoints, comboPenalty, milestoneBonus };
  }

  // === 乘数计算 ===
  _getComboMultiplier(combo) {
    return 1 + Math.log(combo + 1) * this.COMBO_PARAMS.logBase;
  }

  _getComboPenalty(combo) {
    const basePenalty = Math.min(70, combo);
    const { low, mid, high } = this.COMBO_PARAMS.penalty;

    if (combo <= 10) {
      return Math.round(basePenalty * low);
    } else if (combo <= 50) {
      return Math.round(10 * low + (basePenalty - 10) * mid);
    } else {
      return Math.round(10 * low + 40 * mid + Math.sqrt(combo - 50) * high);
    }
  }

  _getMilestoneBonus(combo) {
    const milestoneIndex = this.COMBO_MILESTONES.indexOf(combo);
    if (milestoneIndex < 0) return 0;

    const { baseBonus, growthBase, scaleCap } = this.MILESTONE_PARAMS;
    const scaleFactor = Math.min(scaleCap, 1 + milestoneIndex * 0.25);
    const bonus =
      Math.pow(growthBase, milestoneIndex) * baseBonus * scaleFactor;

    return Math.min(800, Math.round(bonus));
  }

  // === 工具方法 ===
  _clampPoints(points) {
    return Math.min(
      this.SCORE_LIMITS.max,
      Math.max(this.SCORE_LIMITS.min, points)
    );
  }

  _formatMultipliers(multipliers) {
    return Object.fromEntries(
      Object.entries(multipliers).map(([key, value]) => [key, value.toFixed(2)])
    );
  }
}
