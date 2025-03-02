import { gameConfig } from '@js/config/gameConfig.js';
import { formatTime } from '@js/utils/timeFormat.js';
import { DifficultyManager } from '@js/core/difficulty.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class GameState {
  constructor() {
    console.log('[GameState] 初始化');
    this.difficultyManager = new DifficultyManager();
    this.currentTimeIndex = parseInt(safeStorage.get('currentTimeIndex', '0'));
    this.statsManager = null; // 将在Game类中注入
    this.reset();
  }

  setStatsManager(statsManager) {
    this.statsManager = statsManager;
  }

  reset() {
    this.gameOver = false;
    this.isInitialized = true;
    this.isPlaying = false;
    this.isPaused = false;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    this.difficultyManager.reset();
    this.stopTimer();
  }

  activateTimer(onTick, onTimeUp) {
    this.stopTimer();
    this.startPlaying();

    // 恢复统计跟踪
    if (this.statsManager) {
      this.statsManager.resumeTracking();
    }

    const tick = () => {
      if (this.timeLeft <= 0) {
        this.stopTimer();
        onTimeUp();
        return;
      }

      this.timeLeft--;
      onTick(this.timeLeft);
      this.timer = setTimeout(tick, 1000); // 递归调用
    };

    tick();
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = null;
    this.isPlaying = false;

    // 暂停统计跟踪，避免空闲时间计入游戏统计
    if (this.statsManager) {
      this.statsManager.pauseTracking();
    }
  }

  pauseGame() {
    if (this.isPlaying && !this.isPaused) {
      this.isPaused = true;
      this.stopTimer();
      return true;
    }
    return false;
  }

  resumeGame(onTick, onTimeUp) {
    if (this.isPaused) {
      this.isPaused = false;
      this.activateTimer(onTick, onTimeUp);
      return true;
    }
    return false;
  }

  switchGameTime() {
    if (!this.canSwitchSettings()) {
      return null;
    }

    this.currentTimeIndex =
      (this.currentTimeIndex + 1) % gameConfig.timeDurations.length;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    safeStorage.set('currentTimeIndex', this.currentTimeIndex);

    console.log(`[GameState] 切换时间: ${formatTime(this.timeLeft)}`);
    return formatTime(this.timeLeft);
  }

  getCurrentTimeIndex() {
    return this.currentTimeIndex;
  }

  canSwitchSettings() {
    return this.gameOver || !this.isPlaying;
  }

  startPlaying() {
    this.isPlaying = true;
    this.isPaused = false;
  }

  endGame(stats, score) {
    this.gameOver = true;
    this.isInitialized = false;
    this.stopTimer();
    console.log(
      `[GameState] 游戏结束: 分数=${score}, 最大连击=${stats?.maxCombo}`
    );
  }

  isGameRunning() {
    return (
      !this.gameOver && this.isInitialized && this.isPlaying && !this.isPaused
    );
  }

  isOver() {
    return this.gameOver;
  }

  isPaused() {
    return this.isPaused;
  }

  getRemainingTime() {
    return this.timeLeft;
  }

  getTotalTime() {
    return gameConfig.timeDurations[this.currentTimeIndex];
  }
}
