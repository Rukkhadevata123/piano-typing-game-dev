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

    // === 事件系统 - 简化为单一事件发射器 ===
    this.eventListeners = new Map();
  }

  // === 事件系统 ===
  on(eventType, callback) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType).add(callback);
  }

  off(eventType, callback) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  emit(eventType, data = null) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[StatsManager] 事件回调错误 (${eventType}):`, error);
        }
      });
    }
  }

  // === 主要统计更新 ===
  update(isHit) {
    console.log(`[StatsManager] 更新统计: isHit=${isHit}`);

    const previousStats = this.getStats();

    this._updateTimeTracking();
    this._updateHitMissStats(isHit);
    const comboChange = this._updateComboStats(isHit);

    const currentStats = this.getStats();

    // 发射统一的更新事件，包含所有必要信息
    this.emit('statsUpdated', {
      isHit,
      previousStats,
      currentStats,
      comboChange,
    });
  }

  // === 专注模式管理 ===
  toggleFocusMode() {
    this.focusMode = !this.focusMode;
    this._resetFocusData();
    this._manageFocusChecking();

    console.log(`[StatsManager] 专注模式: ${this.focusMode ? '开启' : '关闭'}`);

    // 发射专注模式变化事件
    this.emit('focusModeChanged', { focusMode: this.focusMode });

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
      this.emit('focusGameEnd', { reason: 'consecutive_misses' });
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
    this.emit('gameStateChanged', { isPlaying: true });
  }

  stopPlaying() {
    this.gameState.isPlaying = false;
    this._stopFocusChecking();
    this.emit('gameStateChanged', { isPlaying: false });
  }

  reset() {
    console.log('[StatsManager] 重置所有统计');

    const oldStats = this.getStats();

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

    const newStats = this.getStats();

    this.emit('statsReset', { oldStats, newStats });
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

    return {
      accuracy,
      cps,
      maxCombo: this.gameStats.maxCombo || 0,
      currentCombo: this.gameStats.currentCombo,
      totalHits: this.gameStats.totalHits || 0,
      totalMisses: this.gameStats.totalMisses || 0,
      playTime: Math.round(playTime * 10) / 10,
    };
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
    const oldCombo = this.gameStats.currentCombo;
    const oldMaxCombo = this.gameStats.maxCombo;

    // 检查连击中断
    const comboBreak =
      !isHit && oldCombo > 5
        ? {
          combo: oldCombo,
          wasSignificant: true,
        }
        : null;

    // 更新连击数
    this.gameStats.currentCombo = isHit ? this.gameStats.currentCombo + 1 : 0;
    this.gameStats.maxCombo = Math.max(
      this.gameStats.maxCombo,
      this.gameStats.currentCombo
    );

    const newCombo = this.gameStats.currentCombo;
    const newMaxCombo = this.gameStats.maxCombo;

    console.log(`[StatsManager] 连击: ${oldCombo} -> ${newCombo}`);

    if (comboBreak) {
      console.log(`[StatsManager] 连击中断: ${comboBreak.combo}`);
    }

    if (newMaxCombo > oldMaxCombo) {
      console.log(`[StatsManager] 新的最大连击: ${newMaxCombo}`);
    }

    // 返回连击变化信息
    return {
      oldCombo,
      newCombo,
      maxComboChanged: newMaxCombo > oldMaxCombo,
      comboBreak,
    };
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
        this.emit('focusGameEnd', { reason: 'timeout' });
      }
    }, 200);
  }

  _stopFocusChecking() {
    if (this.focusData.checkInterval) {
      clearInterval(this.focusData.checkInterval);
      this.focusData.checkInterval = null;
    }
  }

  // === 清理资源 ===
  destroy() {
    this._stopFocusChecking();
    this.eventListeners.clear();
  }
}
