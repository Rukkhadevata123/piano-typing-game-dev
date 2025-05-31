export class StatsManager {
  constructor() {
    console.log('[StatsManager] 初始化');

    // === 基础统计 ===
    this.gameStats = {
      totalHits: 0,
      totalMisses: 0,
      currentCombo: 0,
      maxCombo: 0,
    };

    // === 时间管理 ===
    this.timeTracking = {
      startTime: Date.now(),
      lastUpdateTime: null,
      activeTotalTime: 0,
    };

    // === 专注模式 ===
    this.focusMode = false;
    this.focusData = {
      lastActionTime: Date.now(),
      consecutiveMisses: 0,
      checkInterval: null,
    };

    // === 游戏状态 ===
    this.gameState = {
      isPlaying: false,
    };

    // === 事件回调 ===
    this.callbacks = {
      onStatsChange: null,
      onComboBreak: null,
      onFocusModeGameEnd: null,
    };
  }

  // === 主要统计更新 ===
  update(isHit) {
    console.log(`[StatsManager] 更新统计: isHit=${isHit}`);

    this._updateTimeTracking();
    this._updateHitMissStats(isHit);
    this._updateComboStats(isHit);

    this.callbacks.onStatsChange?.();
  }

  // === 专注模式管理 ===
  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    this._resetFocusData();
    this._manageFocusChecking();

    console.log(`[StatsManager] 专注模式: ${this.focusMode ? '开启' : '关闭'}`);
    return this.focusMode;
  }

  updateLastActionTime() {
    this.focusData.lastActionTime = Date.now();
  }

  recordMiss() {
    if (!this.focusMode) return false;

    this.focusData.consecutiveMisses++;
    if (this.focusData.consecutiveMisses >= 2) {
      console.log('[StatsManager] 专注模式: 连续失误两次，游戏结束');
      this.callbacks.onFocusModeGameEnd?.('consecutive_misses');
      return true;
    }
    return false;
  }

  recordHit() {
    this.focusData.consecutiveMisses = 0;
    this.updateLastActionTime();
  }

  // === 游戏生命周期 ===
  startPlaying() {
    this.gameState.isPlaying = true;
    if (this.focusMode) {
      this._startFocusChecking();
    }
  }

  stopPlaying() {
    this.gameState.isPlaying = false;
    this._stopFocusChecking();
  }

  reset() {
    console.log('[StatsManager] 重置所有统计');

    this.gameStats = {
      totalHits: 0,
      totalMisses: 0,
      currentCombo: 0,
      maxCombo: 0,
    };
    this.timeTracking = {
      startTime: Date.now(),
      lastUpdateTime: null,
      activeTotalTime: 0,
    };
    this._resetFocusData();

    this.callbacks.onStatsChange?.();
  }

  // === 数据获取 ===
  getStats() {
    const totalAttempts = this.gameStats.totalHits + this.gameStats.totalMisses;
    const accuracy =
      totalAttempts > 0
        ? Math.round((this.gameStats.totalHits / totalAttempts) * 1000) / 10
        : 100;

    const playTime = this._calculatePlayTime();
    const cps = Math.round((this.gameStats.totalHits / playTime) * 10) / 10;

    const result = {
      accuracy,
      cps,
      maxCombo: this.gameStats.maxCombo || 0,
      currentCombo: this.gameStats.currentCombo,
      totalHits: this.gameStats.totalHits || 0,
      totalMisses: this.gameStats.totalMisses || 0,
      playTime: Math.round(playTime * 10) / 10,
    };

    console.log('[StatsManager] 获取统计:', result);
    return result;
  }

  // === 内部方法 ===
  _updateTimeTracking() {
    const now = Date.now();
    if (this.timeTracking.lastUpdateTime) {
      const elapsed = (now - this.timeTracking.lastUpdateTime) / 1000;
      if (elapsed < 2) {
        this.timeTracking.activeTotalTime += elapsed;
      }
    }
    this.timeTracking.lastUpdateTime = now;
  }

  _updateHitMissStats(isHit) {
    this.gameStats.totalHits += isHit ? 1 : 0;
    this.gameStats.totalMisses += isHit ? 0 : 1;
  }

  _updateComboStats(isHit) {
    if (!isHit && this.gameStats.currentCombo > 5) {
      console.log(`[StatsManager] 连击中断: ${this.gameStats.currentCombo}`);
      this.callbacks.onComboBreak?.(this.gameStats.currentCombo);
    }

    const oldCombo = this.gameStats.currentCombo;
    this.gameStats.currentCombo = isHit ? this.gameStats.currentCombo + 1 : 0;
    const oldMaxCombo = this.gameStats.maxCombo;
    this.gameStats.maxCombo = Math.max(
      this.gameStats.maxCombo,
      this.gameStats.currentCombo
    );

    console.log(
      `[StatsManager] 连击: ${oldCombo} -> ${this.gameStats.currentCombo}`
    );
    if (this.gameStats.maxCombo > oldMaxCombo) {
      console.log(`[StatsManager] 新的最大连击: ${this.gameStats.maxCombo}`);
    }
  }

  _calculatePlayTime() {
    const elapsedTime = (Date.now() - this.timeTracking.startTime) / 1000;
    return Math.max(
      0.5,
      this.timeTracking.activeTotalTime > 0
        ? this.timeTracking.activeTotalTime
        : elapsedTime
    );
  }

  _resetFocusData() {
    this.focusData.lastActionTime = Date.now();
    this.focusData.consecutiveMisses = 0;
    this._stopFocusChecking();
  }

  _manageFocusChecking() {
    this._stopFocusChecking();
    if (this.focusMode && this.gameState.isPlaying) {
      this._startFocusChecking();
    }
  }

  _startFocusChecking() {
    this.focusData.checkInterval = setInterval(() => {
      if (!this.gameState.isPlaying || !this.focusMode) {
        this._stopFocusChecking();
        return;
      }

      const timeSinceLastAction = Date.now() - this.focusData.lastActionTime;
      if (timeSinceLastAction > 1000) {
        console.log('[StatsManager] 专注模式: 操作超时，游戏结束');
        this._stopFocusChecking();
        this.callbacks.onFocusModeGameEnd?.('timeout');
      }
    }, 200);
  }

  _stopFocusChecking() {
    if (this.focusData.checkInterval) {
      clearInterval(this.focusData.checkInterval);
      this.focusData.checkInterval = null;
    }
  }

  // === 事件回调设置 ===
  set onStatsChange(callback) {
    this.callbacks.onStatsChange = callback;
  }
  set onFocusModeGameEnd(callback) {
    this.callbacks.onFocusModeGameEnd = callback;
  }
}
