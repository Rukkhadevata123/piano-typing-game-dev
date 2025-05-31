import { safeStorage } from '@js/utils/safeStorage.js';

export class RatingSystem {
  constructor() {
    this.STORAGE_KEY = 'playerRating';
    this.MIN_GAME_DURATION = 30; // 短于此秒数的游戏不计入等级分
    this.BEST_RECORDS_COUNT = 10; // 保留最好的N次记录
    this.RATING_HALF_LIFE = 30 * 24 * 60 * 60 * 1000; // 30天半衰期（毫秒）

    // 时间权重系数相关参数
    this.TIME_WEIGHT_BASE = 1.0; // 1分钟游戏的基准权重
    this.TIME_WEIGHT_MAX = 2.5; // 最大权重倍数
    this.TIME_WEIGHT_POWER = 0.2; // 时间权重增长指数因子，小于1表示增长递减

    this.loadRating();
    this.onRatingUpdated = null; // 添加事件回调

    this._isUpdating = false; // 防止重复更新
  }

  // 增加保存历史最佳记录的功能
  loadRating() {
    const storedData = safeStorage.get(this.STORAGE_KEY, null);
    if (storedData) {
      this.currentRating = storedData.rating;
      this.totalWeight = storedData.weight;
      this.gamesPlayed = storedData.games || 0;
      this.bestRecords = storedData.bestRecords || [];
    } else {
      this.currentRating = 0;
      this.totalWeight = 0;
      this.gamesPlayed = 0;
      this.bestRecords = [];
    }
    console.log(
      `[RatingSystem] 加载等级分: ${this.currentRating.toFixed(1)}，游戏场次: ${this.gamesPlayed}, 最佳记录: ${this.bestRecords.length}条`
    );
  }

  /**
   * 判断一个等级是否高于另一个等级
   * @param {Object} levelA 第一个等级对象
   * @param {Object} levelB 第二个等级对象
   * @returns {boolean} levelA是否高于levelB
   */
  isLevelHigher(levelA, levelB) {
    const levels = [
      '青铜等级',
      '白银等级',
      '黄金等级',
      '蓝宝石等级',
      '红宝石等级',
      '绿宝石等级',
      '紫水晶等级',
      '珍珠等级',
      '黑曜石等级',
      '钻石等级',
    ];

    const indexA = levels.indexOf(levelA.name);
    const indexB = levels.indexOf(levelB.name);

    return indexA > indexB;
  }

  /**
   * 根据游戏时间获取权重系数 - 使用对数增长模型
   * @param {number} duration 游戏时长（秒）
   * @returns {number} 权重系数
   */
  getTimeWeightFactor(duration) {
    // 如果时长小于1分钟，则按线性比例计算
    if (duration < 60) {
      return this.TIME_WEIGHT_BASE * (duration / 60);
    }

    // 使用对数增长公式计算权重
    // 公式: BASE * (duration/60)^POWER, 限制最大值为MAX
    const minutesRatio = duration / 60;
    const weight =
      this.TIME_WEIGHT_BASE * Math.pow(minutesRatio, this.TIME_WEIGHT_POWER);

    // 限制最大权重
    return Math.min(this.TIME_WEIGHT_MAX, weight);
  }

  /**
   * 计算单局游戏的等级分
   * @param {Object} gameData 游戏数据
   * @returns {number} 本局等级分
   */
  calculateGameRating(gameData) {
    const { score, duration, stats } = gameData;

    // 计算基础等级分：分数÷开方(时间)
    const baseRating = score / Math.sqrt(duration);

    // 准确率系数 - 更符合音游评分风格
    let accuracyFactor;
    if (stats.accuracy < 70) {
      // 低于70%的准确率获得的加成有限
      accuracyFactor = Math.pow(stats.accuracy / 70, 2) * 0.5;
    } else {
      // 采用类似Phigros的公式，使高准确率获得更高奖励
      // ((100*ACC-55)/45)^2 简化并调整为我们的系统
      accuracyFactor = Math.pow((stats.accuracy - 70) / 30, 2) + 0.5;
    }

    // 应用CPS系数：CPS越高，技术越好
    const cpsFactor = Math.min(2.5, Math.max(0.5, stats.cps / 2.5));

    // 时间权重因子
    const timeWeightFactor = this.getTimeWeightFactor(duration);

    // 最终计算
    const finalRating =
      baseRating * accuracyFactor * cpsFactor * timeWeightFactor;

    // 详细日志记录每个因子的贡献
    console.log(
      `[RatingSystem] 本局等级分计算: 
     基础评分=${baseRating.toFixed(1)},
     准确率因子=${accuracyFactor.toFixed(2)} (${stats.accuracy}%),
     CPS因子=${cpsFactor.toFixed(2)} (${stats.cps}),
     时间权重因子=${timeWeightFactor.toFixed(2)} (${duration}s),
     最终等级分=${finalRating.toFixed(1)}`
    );

    return finalRating;
  }

  /**
   * 更新玩家的等级分
   * @param {Object} gameData 游戏数据
   * @param {boolean} focusModeBonus 是否应用专注模式加成
   * @returns {Object} 更新后的等级分信息
   */
  updateRating(gameData, focusModeBonus = false) {
    // 防止重复调用
    if (this._isUpdating) {
      console.warn('[RatingSystem] 已有一个评级更新进行中，避免重复操作');
      return null;
    }

    this._isUpdating = true;

    try {
      // 短于最小时间的游戏不计入等级分
      if (gameData.duration < this.MIN_GAME_DURATION) {
        return {
          currentRating: this.currentRating,
          changed: false,
          gameRating: 0,
        };
      }

      // 计算本局等级分
      let gameRating = this.calculateGameRating(gameData);

      // 应用专注模式加成
      if (focusModeBonus) {
        const originalRating = gameRating;
        gameRating = Math.round(gameRating * 1.2 * 10) / 10; // 增加20%并保留一位小数
        console.log(
          `[RatingSystem] 专注模式等级分加成: ${originalRating.toFixed(1)} → ${gameRating.toFixed(1)} (+20%)`
        );
      }

      // 记录此次游戏数据，确保保存最大连击
      const record = {
        rating: gameRating,
        score: gameData.score,
        accuracy: gameData.stats.accuracy,
        cps: gameData.stats.cps,
        maxCombo: gameData.stats.maxCombo, // 确保保存最大连击数
        duration: gameData.duration,
        date: Date.now(),
        mode: gameData.mode,
        focusMode: focusModeBonus, // 记录是否为专注模式
      };

      // 更新最佳记录
      this.updateBestRecords(record);

      // 重新计算总等级分 - 基于最佳记录
      this.recalculateRating();

      // 增加游戏场次
      this.gamesPlayed++;

      // 保存到本地存储
      this.saveRating();

      const result = {
        currentRating: this.currentRating,
        changed: true,
        gameRating: gameRating,
        isNewBest:
          this.bestRecords.length > 0 &&
          this.bestRecords[0].date === record.date,
        focusMode: focusModeBonus, // 在返回结果中也标记专注模式
        level: this.calculateLevel(this.currentRating), // 🔧 添加：当前等级信息
      };

      // 添加：触发等级分更新事件
      if (this.onRatingUpdated) {
        this.onRatingUpdated(result);
      }
      return result;
    } finally {
      this._isUpdating = false;
    }
  }

  // 更新最佳记录
  updateBestRecords(newRecord) {
    // 检查是否已经有相同时间戳的记录存在
    if (
      this.bestRecords.some(
        (existingRecord) => existingRecord.date === newRecord.date
      )
    ) {
      console.warn('[RatingSystem] 检测到重复记录，跳过添加');
      return;
    }
    // 添加新记录
    this.bestRecords.push(newRecord);

    // 按等级分排序
    this.bestRecords.sort((a, b) => b.rating - a.rating);

    // 只保留前N条
    if (this.bestRecords.length > this.BEST_RECORDS_COUNT) {
      this.bestRecords = this.bestRecords.slice(0, this.BEST_RECORDS_COUNT);
    }
  }

  // 基于最佳记录重新计算总等级分，同时考虑游戏时间和记录时间的加权
  recalculateRating() {
    if (this.bestRecords.length === 0) {
      this.currentRating = 0;
      return;
    }

    // 复制记录，并按日期排序（最新的在前）
    const sortedByDate = [...this.bestRecords].sort((a, b) => b.date - a.date);

    // 计算总权重和加权总和
    const now = Date.now();
    let totalWeight = 0;
    let weightedSum = 0;

    // 使用指数衰减函数计算时间权重
    sortedByDate.forEach((record) => {
      // 1. 按游戏时间计算基础权重
      const durationWeight = this.getTimeWeightFactor(record.duration);

      // 2. 按记录时间计算加权
      const age = now - record.date;
      const timeDecayFactor = Math.pow(2, -age / this.RATING_HALF_LIFE); // 时间衰减因子

      // 3. 结合两种权重
      const combinedWeight = durationWeight * timeDecayFactor;

      // 累加权重和加权评分
      totalWeight += combinedWeight;
      weightedSum += record.rating * combinedWeight;

      console.log(
        `[RatingSystem] 记录评分: ${record.rating.toFixed(1)}, ` +
          `日期: ${new Date(record.date).toLocaleString()}, ` +
          `游戏时长: ${record.duration}s, ` +
          `游戏时长权重: ${durationWeight.toFixed(2)}, ` +
          `时间衰减因子: ${timeDecayFactor.toFixed(3)}, ` +
          `总权重: ${combinedWeight.toFixed(3)}`
      );
    });

    // 计算加权平均值
    this.currentRating = weightedSum / totalWeight;

    console.log(
      `[RatingSystem] 双重加权等级分计算完成: ${this.currentRating.toFixed(1)}, ` +
        `总权重: ${totalWeight.toFixed(2)}`
    );
  }

  /**
   * 保存当前等级分到本地存储
   */
  saveRating() {
    safeStorage.set(this.STORAGE_KEY, {
      rating: this.currentRating,
      weight: this.totalWeight,
      games: this.gamesPlayed,
      lastUpdate: Date.now(),
      bestRecords: this.bestRecords,
    });
    console.log(
      `[RatingSystem] 保存等级分: ${this.currentRating.toFixed(1)}, 最佳记录: ${this.bestRecords.length}条`
    );
  }

  /**
   * 获取玩家当前等级分
   */
  getRating() {
    return {
      rating: this.currentRating,
      games: this.gamesPlayed,
      level: this.calculateLevel(this.currentRating),
    };
  }

  // 获取玩家最佳记录
  getBestRecords() {
    // 如果bestRecords不存在，初始化为空数组
    if (!this.bestRecords) {
      this.bestRecords = [];
    }
    return this.bestRecords;
  }

  /**
   * 根据等级分计算段位
   */
  calculateLevel(rating) {
    // 修改段位系统，每个等级间隔500分，从1000分开始
    if (rating < 5000) return { name: '青铜等级', color: '#cd7f32' };
    if (rating < 6250) return { name: '白银等级', color: '#c0c0c0' };
    if (rating < 7500) return { name: '黄金等级', color: '#ffd700' };
    if (rating < 8750) return { name: '蓝宝石等级', color: '#0073cf' };
    if (rating < 10000) return { name: '红宝石等级', color: '#e0115f' };
    if (rating < 11250) return { name: '绿宝石等级', color: '#50c878' };
    if (rating < 12500) return { name: '紫水晶等级', color: '#9966cc' };
    if (rating < 13750) return { name: '珍珠等级', color: '#fdeef4' };
    if (rating < 15000) return { name: '黑曜石等级', color: '#413839' };
    return { name: '钻石等级', color: '#b9f2ff' };
  }
}
