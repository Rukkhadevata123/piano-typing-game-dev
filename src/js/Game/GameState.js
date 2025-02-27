import { gameConfig } from '@js/config/gameConfig.js';
import { formatTime } from '@js/utils/timeFormat.js';
import { DifficultyManager } from '@js/core/difficulty.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class GameState {
  constructor() {
    console.log('[GameState] 开始初始化');
    this.difficultyManager = new DifficultyManager();

    // 加载保存的时间索引
    this.currentTimeIndex = this.loadSavedTimeIndex();
    console.log(`[GameState] 加载的时间索引: ${this.currentTimeIndex}`);

    this.reset();
    console.log('[GameState] 初始化完成');
  }

  loadSavedTimeIndex() {
    try {
      console.log('[GameState] 尝试加载保存的时间索引');
      const savedIndex = parseInt(safeStorage.get('currentTimeIndex', '0'));
      console.log(`[GameState] 从存储加载的时间索引原始值: ${savedIndex}`);

      const validIndex =
        savedIndex >= 0 && savedIndex < gameConfig.timeDurations.length
          ? savedIndex
          : 0;

      console.log(`[GameState] 验证后的时间索引: ${validIndex}`);
      return validIndex;
    } catch (error) {
      console.error('[GameState] 加载时间索引出错:', error);
      return 0;
    }
  }

  reset() {
    console.log('[GameState] 重置游戏状态');
    this.gameOver = false;
    this.isInitialized = true;
    this.isPlaying = false;

    // 设置剩余时间
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    console.log(
      `[GameState] 重置剩余时间为: ${this.timeLeft} (索引: ${this.currentTimeIndex})`
    );

    this.difficultyManager.reset();
    this.stopTimer();
    console.log('[GameState] 游戏状态重置完成');
  }

  activateTimer(onTick, onTimeUp) {
    console.log('[GameState] 激活计时器');
    this.stopTimer();
    this.startPlaying();
    console.log(`[GameState] 游戏开始，初始剩余时间: ${this.timeLeft}`);

    this.timer = setInterval(() => {
      if (this.timeLeft <= 0) {
        console.log('[GameState] 计时结束');
        this.handleTimerEnd(onTimeUp);
        return;
      }

      this.timeLeft--;
      console.log(`[GameState] 计时更新: ${this.timeLeft}`);
      onTick(this.timeLeft);
    }, 1000);

    console.log('[GameState] 计时器已启动');
  }

  handleTimerEnd(callback) {
    console.log('[GameState] 处理计时结束');
    this.stopTimer();
    callback();
    console.log('[GameState] 计时结束回调执行完成');
  }

  stopTimer() {
    console.log('[GameState] 停止计时器');
    if (this.timer) {
      clearInterval(this.timer);
      console.log('[GameState] 清理计时器间隔');
    }
    this.timer = null;
    this.isPlaying = false;
    console.log('[GameState] 计时器已停止, isPlaying=false');
  }

  switchGameTime() {
    console.log('[GameState] 尝试切换游戏时间');
    if (!this.canSwitchSettings()) {
      console.log('[GameState] 无法切换时间：游戏正在进行中');
      return null;
    }

    try {
      // 更新时间索引
      const oldIndex = this.currentTimeIndex;
      this.currentTimeIndex =
        (this.currentTimeIndex + 1) % gameConfig.timeDurations.length;

      console.log(
        `[GameState] 切换时间索引: ${oldIndex} -> ${this.currentTimeIndex}`
      );

      // 更新剩余时间
      this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
      console.log(`[GameState] 新的剩余时间: ${this.timeLeft}`);

      // 保存设置
      safeStorage.set('currentTimeIndex', this.currentTimeIndex);
      console.log('[GameState] 时间索引保存到存储');

      const formattedTime = formatTime(this.timeLeft);
      console.log(`[GameState] 返回格式化时间: ${formattedTime}`);
      return formattedTime;
    } catch (error) {
      console.error('[GameState] 切换游戏时间失败:', error);
      return null;
    }
  }

  getCurrentTimeIndex() {
    console.log(`[GameState] 获取当前时间索引: ${this.currentTimeIndex}`);
    return this.currentTimeIndex;
  }

  canSwitchSettings() {
    const canSwitch = this.gameOver || !this.isPlaying;
    console.log(
      `[GameState] 检查是否可以切换设置: ${canSwitch} (gameOver=${this.gameOver}, isPlaying=${this.isPlaying})`
    );
    return canSwitch;
  }

  startPlaying() {
    console.log('[GameState] 开始游戏');
    this.isPlaying = true;
  }

  endGame() {
    console.log('[GameState] 结束游戏');
    this.gameOver = true;
    this.isInitialized = false;
    this.stopTimer();
    console.log('[GameState] 游戏状态更新: gameOver=true, isInitialized=false');
  }

  isGameRunning() {
    const running = !this.gameOver && this.isInitialized && this.isPlaying;
    console.log(`[GameState] 检查游戏是否运行中: ${running}`);
    return running;
  }

  isOver() {
    console.log(`[GameState] 检查游戏是否结束: ${this.gameOver}`);
    return this.gameOver;
  }
}
