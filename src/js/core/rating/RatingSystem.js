import { safeStorage } from '@js/utils/safeStorage.js';

export class RatingSystem {
  constructor() {
    // === 系统配置 ===
    this.CONFIG = {
      storageKey: 'playerRating',
      minGameDuration: 30,
      bestRecordsCount: 10,
      ratingHalfLife: 30 * 24 * 60 * 60 * 1000, // 30天
      timeWeight: {
        base: 1.0,
        max: 2.5,
        power: 0.2,
      },
    };

    // === 等级定义 ===
    this.LEVELS = [
      { name: '青铜等级', color: '#cd7f32', threshold: 5000 },
      { name: '白银等级', color: '#c0c0c0', threshold: 6250 },
      { name: '黄金等级', color: '#ffd700', threshold: 7500 },
      { name: '蓝宝石等级', color: '#0073cf', threshold: 8750 },
      { name: '红宝石等级', color: '#e0115f', threshold: 10000 },
      { name: '绿宝石等级', color: '#50c878', threshold: 11250 },
      { name: '紫水晶等级', color: '#9966cc', threshold: 12500 },
      { name: '珍珠等级', color: '#fdeef4', threshold: 13750 },
      { name: '黑曜石等级', color: '#413839', threshold: 15000 },
      { name: '钻石等级', color: '#b9f2ff', threshold: Infinity },
    ];

    // === 玩家数据 ===
    this.playerData = {
      currentRating: 0,
      totalWeight: 0,
      gamesPlayed: 0,
      bestRecords: [],
    };

    this.callbacks = {
      onRatingUpdated: null,
    };

    this._isUpdating = false;
    this.loadRating();
  }

  // === 主要API ===
  updateRating(gameData, focusModeBonus = false) {
    if (this._isUpdating) {
      console.warn('[RatingSystem] 已有一个评级更新进行中，避免重复操作');
      return null;
    }

    this._isUpdating = true;
    try {
      return this._processRatingUpdate(gameData, focusModeBonus);
    } finally {
      this._isUpdating = false;
    }
  }

  getRating() {
    return {
      rating: this.playerData.currentRating,
      games: this.playerData.gamesPlayed,
      level: this.calculateLevel(this.playerData.currentRating),
    };
  }

  getBestRecords() {
    return this.playerData.bestRecords || [];
  }

  // === 等级计算 ===
  calculateLevel(rating) {
    const level =
      this.LEVELS.find((l) => rating < l.threshold) ||
      this.LEVELS[this.LEVELS.length - 1];
    return { name: level.name, color: level.color };
  }

  isLevelHigher(levelA, levelB) {
    const indexA = this.LEVELS.findIndex((l) => l.name === levelA.name);
    const indexB = this.LEVELS.findIndex((l) => l.name === levelB.name);
    return indexA > indexB;
  }

  // === 内部处理方法 ===
  _processRatingUpdate(gameData, focusModeBonus) {
    if (gameData.duration < this.CONFIG.minGameDuration) {
      return {
        currentRating: this.playerData.currentRating,
        changed: false,
        gameRating: 0,
      };
    }

    let gameRating = this._calculateGameRating(gameData);
    if (focusModeBonus) {
      const originalRating = gameRating;
      gameRating = Math.round(gameRating * 1.2 * 10) / 10;
      console.log(
        `[RatingSystem] 专注模式等级分加成: ${originalRating.toFixed(1)} → ${gameRating.toFixed(1)} (+20%)`
      );
    }

    const record = this._createGameRecord(gameData, gameRating, focusModeBonus);
    this._updateBestRecords(record);
    this._recalculateRating();
    this.playerData.gamesPlayed++;
    this._saveRating();

    const result = {
      currentRating: this.playerData.currentRating,
      changed: true,
      gameRating,
      isNewBest: this._isNewBestRecord(record),
      focusMode: focusModeBonus,
    };

    this.callbacks.onRatingUpdated?.();
    return result;
  }

  _calculateGameRating(gameData) {
    const { score, duration, stats } = gameData;

    // 基础等级分计算
    const baseRating = score / Math.sqrt(duration);
    const accuracyFactor = this._getAccuracyFactor(stats.accuracy);
    const cpsFactor = Math.min(2.5, Math.max(0.5, stats.cps / 2.5));
    const timeWeightFactor = this._getTimeWeightFactor(duration);

    const finalRating =
      baseRating * accuracyFactor * cpsFactor * timeWeightFactor;

    console.log(
      `[RatingSystem] 本局等级分计算: 基础=${baseRating.toFixed(1)}, ` +
        `准确率因子=${accuracyFactor.toFixed(2)} (${stats.accuracy}%), ` +
        `CPS因子=${cpsFactor.toFixed(2)} (${stats.cps}), ` +
        `时间权重=${timeWeightFactor.toFixed(2)} (${duration}s), ` +
        `最终=${finalRating.toFixed(1)}`
    );

    return finalRating;
  }

  _getAccuracyFactor(accuracy) {
    if (accuracy < 70) {
      return Math.pow(accuracy / 70, 2) * 0.5;
    } else {
      return Math.pow((accuracy - 70) / 30, 2) + 0.5;
    }
  }

  _getTimeWeightFactor(duration) {
    if (duration < 60) {
      return this.CONFIG.timeWeight.base * (duration / 60);
    }

    const minutesRatio = duration / 60;
    const weight =
      this.CONFIG.timeWeight.base *
      Math.pow(minutesRatio, this.CONFIG.timeWeight.power);
    return Math.min(this.CONFIG.timeWeight.max, weight);
  }

  // === 记录管理 ===
  _createGameRecord(gameData, gameRating, focusModeBonus) {
    return {
      rating: gameRating,
      score: gameData.score,
      accuracy: gameData.stats.accuracy,
      cps: gameData.stats.cps,
      maxCombo: gameData.stats.maxCombo,
      duration: gameData.duration,
      date: Date.now(),
      mode: gameData.mode,
      focusMode: focusModeBonus,
    };
  }

  _updateBestRecords(newRecord) {
    if (this.playerData.bestRecords.some((r) => r.date === newRecord.date)) {
      console.warn('[RatingSystem] 检测到重复记录，跳过添加');
      return;
    }

    this.playerData.bestRecords.push(newRecord);
    this.playerData.bestRecords.sort((a, b) => b.rating - a.rating);

    if (this.playerData.bestRecords.length > this.CONFIG.bestRecordsCount) {
      this.playerData.bestRecords = this.playerData.bestRecords.slice(
        0,
        this.CONFIG.bestRecordsCount
      );
    }
  }

  _recalculateRating() {
    if (this.playerData.bestRecords.length === 0) {
      this.playerData.currentRating = 0;
      return;
    }

    const sortedByDate = [...this.playerData.bestRecords].sort(
      (a, b) => b.date - a.date
    );
    const now = Date.now();
    let totalWeight = 0;
    let weightedSum = 0;

    sortedByDate.forEach((record) => {
      const durationWeight = this._getTimeWeightFactor(record.duration);
      const age = now - record.date;
      const timeDecayFactor = Math.pow(2, -age / this.CONFIG.ratingHalfLife);
      const combinedWeight = durationWeight * timeDecayFactor;

      totalWeight += combinedWeight;
      weightedSum += record.rating * combinedWeight;

      console.log(
        `[RatingSystem] 记录评分: ${record.rating.toFixed(1)}, ` +
          `日期: ${new Date(record.date).toLocaleString()}, ` +
          `总权重: ${combinedWeight.toFixed(3)}`
      );
    });

    this.playerData.currentRating = weightedSum / totalWeight;
    console.log(
      `[RatingSystem] 双重加权等级分: ${this.playerData.currentRating.toFixed(1)}, 总权重: ${totalWeight.toFixed(2)}`
    );
  }

  _isNewBestRecord(record) {
    return (
      this.playerData.bestRecords.length > 0 &&
      this.playerData.bestRecords[0].date === record.date
    );
  }

  // === 数据持久化 ===
  loadRating() {
    const storedData = safeStorage.get(this.CONFIG.storageKey, null);
    if (storedData) {
      this.playerData = {
        currentRating: storedData.rating || 0,
        totalWeight: storedData.weight || 0,
        gamesPlayed: storedData.games || 0,
        bestRecords: storedData.bestRecords || [],
      };
    }

    console.log(
      `[RatingSystem] 加载等级分: ${this.playerData.currentRating.toFixed(1)}，` +
        `游戏场次: ${this.playerData.gamesPlayed}, 最佳记录: ${this.playerData.bestRecords.length}条`
    );
  }

  _saveRating() {
    safeStorage.set(this.CONFIG.storageKey, {
      rating: this.playerData.currentRating,
      weight: this.playerData.totalWeight,
      games: this.playerData.gamesPlayed,
      lastUpdate: Date.now(),
      bestRecords: this.playerData.bestRecords,
    });

    console.log(
      `[RatingSystem] 保存等级分: ${this.playerData.currentRating.toFixed(1)}, ` +
        `最佳记录: ${this.playerData.bestRecords.length}条`
    );
  }

  // === 事件回调 ===
  set onRatingUpdated(callback) {
    this.callbacks.onRatingUpdated = callback;
  }
}
