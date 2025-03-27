export class StatsManager {
  constructor() {
    console.log('[StatsManager] 初始化');
    this.totalHits = 0;
    this.totalMisses = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = null;
    this.activeTotalTime = 0; // 实际游戏时间（秒）
    this.onStatsChange = null;
    this.onComboBreak = null; // 新增：连击中断事件
    this.isPlaying = false; // 游戏进行中
    this.focusMode = false; // 专注模式状态
    this.lastActionTime = Date.now(); // 最后操作时间
    this.consecutiveMisses = 0; // 连续失误次数
    this.focusCheckInterval = null; // 专注模式检查定时器
    this.onFocusModeGameEnd = null; // 添加专注模式导致游戏结束的回调
  }

  update(isHit) {
    console.log(`[StatsManager] 更新统计: isHit=${isHit}`);

    // 更新活跃游戏时间
    const now = Date.now();
    if (this.lastUpdateTime) {
      // 如果间隔太长（超过2秒）可能是游戏暂停，不计入活跃时间
      const elapsed = (now - this.lastUpdateTime) / 1000;
      if (elapsed < 2) {
        this.activeTotalTime += elapsed;
      }
    }
    this.lastUpdateTime = now;

    // 更新命中/失误计数
    this.totalHits += isHit ? 1 : 0;
    this.totalMisses += isHit ? 0 : 1;

    // 检查连击中断事件
    if (!isHit && this.currentCombo > 5) {
      const brokenCombo = this.currentCombo;
      console.log(`[StatsManager] 连击中断: ${brokenCombo}`);
      this.onComboBreak?.(brokenCombo);
    }

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

  // 切换专注模式
  toggleFocusMode() {
    this.focusMode = !this.focusMode;

    // 重置相关计数器
    this.lastActionTime = Date.now();
    this.consecutiveMisses = 0;

    // 清除已有的检查定时器
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }

    // 如果启用专注模式且游戏正在进行，开始检查
    if (this.focusMode && this.isPlaying) {
      this.startFocusCheck();
    }

    console.log(`[StatsManager] 专注模式: ${this.focusMode ? '开启' : '关闭'}`);
    return this.focusMode;
  }

  startFocusCheck() {
    this.focusCheckInterval = setInterval(() => {
      if (!this.isPlaying || !this.focusMode) {
        clearInterval(this.focusCheckInterval);
        this.focusCheckInterval = null;
        return;
      }

      const now = Date.now();
      const timeSinceLastAction = now - this.lastActionTime;

      // 如果超过1秒没有操作，结束游戏
      if (timeSinceLastAction > 1000) {
        console.log('[StatsManager] 专注模式: 操作超时，游戏结束');
        // 清除定时器
        clearInterval(this.focusCheckInterval);
        this.focusCheckInterval = null;

        // 通知游戏结束
        if (this.onFocusModeGameEnd) {
          this.onFocusModeGameEnd('timeout');
        }
      }
    }, 200); // 每200ms检查一次
  }

  // 更新最后操作时间
  updateLastActionTime() {
    this.lastActionTime = Date.now();
  }

  // 记录失误
  recordMiss() {
    if (this.focusMode) {
      this.consecutiveMisses++;

      // 连续失误两次，结束游戏
      if (this.consecutiveMisses >= 2) {
        console.log('[StatsManager] 专注模式: 连续失误两次，游戏结束');

        // 通知游戏结束
        if (this.onFocusModeGameEnd) {
          this.onFocusModeGameEnd('consecutive_misses');
          return true;
        }
      }
    }
    return false;
  }

  recordHit() {
    this.consecutiveMisses = 0; // 重置连续失误计数
    this.updateLastActionTime();
  }

  startPlaying() {
    this.isPlaying = true;

    // 如果处于专注模式，启动检查
    if (this.focusMode) {
      this.startFocusCheck();
    }
  }

  // 添加一个停止游戏的方法
  stopPlaying() {
    this.isPlaying = false;

    // 清除专注模式检查
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }
  }

  // 结束游戏
  endGame() {
    this.gameOver = true;
    this.isPlaying = false;

    // 清除专注模式检查
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }
  }

  reset() {
    console.log('[StatsManager] 重置所有统计');
    this.totalHits = 0;
    this.totalMisses = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = null;
    this.activeTotalTime = 0;
    this.onStatsChange?.();
  }

  pauseTracking() {
    // 暂时停止时间追踪
    this.lastUpdateTime = null;
  }

  resumeTracking() {
    // 重新开始时间追踪
    this.lastUpdateTime = Date.now();
  }

  getStats() {
    const totalAttempts = this.totalHits + this.totalMisses;

    // 准确率计算优化：保留一位小数
    const accuracy =
      totalAttempts > 0
        ? Math.round((this.totalHits / totalAttempts) * 1000) / 10
        : 100;

    // 计算CPS时使用活跃时间或经过时间的较大值
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const playTime = Math.max(
      0.5,
      this.activeTotalTime > 0 ? this.activeTotalTime : elapsedTime
    );

    // CPS计算优化：保护除以0，限制精度为小数点后1位
    const cps = Math.round((this.totalHits / playTime) * 10) / 10;

    const result = {
      accuracy,
      cps,
      maxCombo: this.maxCombo || 0,
      currentCombo: this.currentCombo,
      totalHits: this.totalHits || 0,
      totalMisses: this.totalMisses || 0,
      playTime: Math.round(playTime * 10) / 10, // 添加游戏时长到统计
    };

    console.log('[StatsManager] 获取统计:', result);
    return result;
  }
}
