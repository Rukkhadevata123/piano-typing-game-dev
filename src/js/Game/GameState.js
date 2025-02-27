import { gameConfig } from '@js/config/gameConfig.js';
import { formatTime } from '@js/utils/timeFormat.js';
import { DifficultyManager } from '@js/core/difficulty.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class GameState {
  constructor() {
    console.log('[GameState] 初始化');
    this.difficultyManager = new DifficultyManager();
    this.currentTimeIndex = parseInt(safeStorage.get('currentTimeIndex', '0'));
    this.reset();
  }

  reset() {
    this.gameOver = false;
    this.isInitialized = true;
    this.isPlaying = false;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    this.difficultyManager.reset();
    this.stopTimer();
  }

  activateTimer(onTick, onTimeUp) {
    this.stopTimer();
    this.startPlaying();

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
      clearInterval(this.timer);
    }
    this.timer = null;
    this.isPlaying = false;
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
  }

  endGame() {
    this.gameOver = true;
    this.isInitialized = false;
    this.stopTimer();
  }

  isGameRunning() {
    return !this.gameOver && this.isInitialized && this.isPlaying;
  }

  isOver() {
    return this.gameOver;
  }
}
