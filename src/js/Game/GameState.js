import { gameConfig } from '@js/config/gameConfig.js';
import { formatTime } from '@js/utils/timeFormat.js';
import { HistoryManager } from '@js/ui/history.js';
import { DifficultyManager } from '@js/core/difficulty.js';

export class GameState {
  constructor(modeManager) {
    this.gameOver = false;
    this.currentTimeIndex = 0;
    this.isInitialized = false;
    this.isPlaying = false;
    this.timeLeft = 0;
    this.timer = null;
    this.difficultyManager = new DifficultyManager();
    this.modeManager = modeManager;
    this.historyManager = new HistoryManager(); // 添加这行
  }

  isGameRunning() {
    return !this.gameOver && this.isInitialized && this.isPlaying;
  }

  canSwitchSettings() {
    return this.gameOver || !this.isPlaying;
  }

  reset() {
    this.gameOver = false;
    this.isInitialized = true;
    this.isPlaying = false;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    if (this.timer) clearInterval(this.timer); // 添加清理计时器的逻辑
    this.difficultyManager.reset(); // 重置难度
  }

  startPlaying() {
    this.isPlaying = true;
  }

  startTimer() {
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
  }

  activateTimer(onTick, onTimeUp) {
    if (this.isPlaying || this.timer) {
      this.stopTimer(); // 确保清理旧计时器
    }

    this.startPlaying();
    this.timer = setInterval(() => {
      if (this.timeLeft <= 0) {
        this.stopTimer();
        onTimeUp();
        return;
      }
      this.timeLeft--;
      onTick(this.timeLeft);
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPlaying = false;
  }

  switchGameTime() {
    if (!this.canSwitchSettings()) return null;
    this.currentTimeIndex =
      (this.currentTimeIndex + 1) % gameConfig.timeDurations.length;
    this.startTimer();
    return formatTime(this.timeLeft);
  }

  endGame(stats, score) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.isInitialized = false;
    this.stopTimer();
  }

  isOver() {
    return this.gameOver;
  }

  updateTimeIndex(newIndex) {
    this.currentTimeIndex = newIndex;
  }

  getCurrentTimeIndex() {
    return this.currentTimeIndex;
  }
}
