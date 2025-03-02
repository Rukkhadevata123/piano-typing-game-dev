import { gameConfig } from '@js/config/gameConfig.js';

export class ScoreCalculator {
  constructor() {
    // 基础得分配置
    this.HIT_POINTS = gameConfig.points.hit;
    this.MISS_POINTS = gameConfig.points.miss;

    // 里程碑连击点位
    this.COMBO_MILESTONES = [
      25, 42, 50, 69, 75, 100, 150, 200, 250, 300, 350, 400, 404, 450, 500, 550,
      600, 650, 700, 750, 777, 800, 850, 900, 950, 1000,
    ];

    // 计算参数
    this.params = {
      // 连击乘数参数 - 增加到0.35让增长更明显
      comboLogBase: 0.35,

      // 连击惩罚参数 - 调整为更严厉的惩罚
      penaltyFactorLow: 0.35, // ≤10连击
      penaltyFactorMid: 0.6, // 11-50连击
      penaltyFactorHigh: 3, // >50连击

      // 里程碑奖励参数
      milestoneBaseBonus: 8,
      milestoneGrowthBase: 1.6, // 使用1.6作为底数而非2
      milestoneScaleCap: 4, // 最大比例因子
    };
  }

  /**
   * 计算最终得分
   * @param {boolean} isHit - 是否命中
   * @param {Object} stats - 游戏统计信息
   * @param {number} timeLeft - 剩余时间
   * @param {number} totalTime - 总时间
   * @returns {Object} 得分详情
   */
  calculate(isHit, stats, timeLeft, totalTime) {
    // 获取各项指标
    const { accuracy, cps, currentCombo } = stats;

    // 1. 计算基础分数
    const basePoints = this.calculateBasePoints(isHit);

    // 2. 计算最终乘数
    const multipliers = this.calculateMultipliers(stats, timeLeft, totalTime);

    // 3. 应用乘数计算得分
    let finalPoints = Math.round(basePoints * multipliers.total);

    // 4. 处理特殊得分调整
    const details = this.calculateSpecialPoints(
      isHit,
      currentCombo,
      finalPoints
    );
    finalPoints = details.adjustedPoints;

    // 5. 限制最终得分范围
    finalPoints = this.clampPoints(finalPoints);

    // 6. 返回完整得分信息
    return {
      points: finalPoints,
      basePoints: basePoints,
      multipliers: {
        combo: multipliers.combo.toFixed(2),
        accuracy: multipliers.accuracy.toFixed(2),
        cps: multipliers.cps.toFixed(2),
        timeLeft: multipliers.timeLeft.toFixed(2),
        total: multipliers.total.toFixed(2),
      },
      details: {
        comboPenalty: details.comboPenalty,
        milestoneBonus: details.milestoneBonus,
      },
    };
  }

  /**
   * 计算基础分数
   */
  calculateBasePoints(isHit) {
    return isHit ? this.HIT_POINTS : this.MISS_POINTS;
  }

  /**
   * 计算所有乘数
   */
  calculateMultipliers(stats, timeLeft, totalTime) {
    const { accuracy, cps, currentCombo } = stats;

    // 各项乘数计算
    const comboMultiplier = this.getComboMultiplier(currentCombo);
    const accuracyMultiplier = 0.5 + accuracy / 100;
    const cpsBonus = Math.min(0.5, cps * 0.1);
    const timeLeftFactor = 1 + (1 - timeLeft / totalTime) * 0.5;

    // 综合计算
    const baseMultiplier = comboMultiplier;
    const bonusFactor =
      accuracyMultiplier - 1 + cpsBonus + (timeLeftFactor - 1);

    // 混合乘加模式
    const totalMultiplier = baseMultiplier * (1 + bonusFactor * 0.5);

    // 应用上下限
    const finalMultiplier = Math.max(0.5, Math.min(4.5, totalMultiplier));

    return {
      combo: comboMultiplier,
      accuracy: accuracyMultiplier,
      cps: 1 + cpsBonus,
      timeLeft: timeLeftFactor,
      total: finalMultiplier,
    };
  }

  /**
   * 计算特殊得分调整（连击惩罚和里程碑奖励）
   */
  calculateSpecialPoints(isHit, currentCombo, currentPoints) {
    let adjustedPoints = currentPoints;
    let comboPenalty = 0;
    let milestoneBonus = 0;

    // 连击中断惩罚
    if (!isHit && currentCombo > 5) {
      comboPenalty = this.getComboPenalty(currentCombo);
      adjustedPoints -= comboPenalty;
    }

    // 里程碑奖励
    if (isHit) {
      milestoneBonus = this.getMilestoneBonus(currentCombo);
      adjustedPoints += milestoneBonus;
    }

    return {
      adjustedPoints,
      comboPenalty,
      milestoneBonus,
    };
  }

  /**
   * 限制分数范围
   */
  clampPoints(points) {
    return Math.min(250, Math.max(-80, points));
  }

  /**
   * 计算连击乘数
   */
  getComboMultiplier(currentCombo) {
    // 使用对数函数，前期增长快，后期放缓但不停止
    // 增加系数到0.35，让连击增长更明显
    // 100连击约为2.6倍，1000连击约为3.4倍
    return 1 + Math.log(currentCombo + 1) * this.params.comboLogBase;
  }

  /**
   * 计算连击中断惩罚
   */
  getComboPenalty(currentCombo) {
    // 基础惩罚，但不超过70
    let basePenalty = Math.min(70, currentCombo);

    if (currentCombo <= 10) {
      // 连击≤10，轻微惩罚
      return Math.round(basePenalty * this.params.penaltyFactorLow);
    } else if (currentCombo <= 50) {
      // 连击10-50，中等惩罚
      return Math.round(
        10 * this.params.penaltyFactorLow +
          (basePenalty - 10) * this.params.penaltyFactorMid
      );
    } else {
      // 连击>50，高惩罚但增长速度放缓
      return Math.round(
        10 * this.params.penaltyFactorLow +
          40 * this.params.penaltyFactorMid +
          Math.sqrt(currentCombo - 50) * this.params.penaltyFactorHigh
      );
    }
  }

  /**
   * 计算里程碑奖励
   */
  getMilestoneBonus(currentCombo) {
    const milestoneIndex = this.COMBO_MILESTONES.indexOf(currentCombo);
    if (milestoneIndex < 0) return 0;

    // 基础奖励
    const baseBonus = this.params.milestoneBaseBonus;

    // 指数增长但使用较小底数1.6
    const scaleFactor = Math.min(
      this.params.milestoneScaleCap,
      1 + milestoneIndex * 0.25
    );

    // 使用1.6作为底数，增长会更平缓
    const exponentialBonus =
      Math.pow(this.params.milestoneGrowthBase, milestoneIndex) *
      baseBonus *
      scaleFactor;

    // 确保奖励适度
    return Math.min(800, Math.round(exponentialBonus));
  }

  /**
   * 帮助测试和调试的方法
   */
  testCalculation(combo, isHit = true) {
    // 模拟标准状态
    const stats = {
      accuracy: 95,
      cps: 3,
      currentCombo: combo,
    };

    // 模拟游戏时间
    const timeLeft = 30;
    const totalTime = 60;

    return this.calculate(isHit, stats, timeLeft, totalTime);
  }
}
