import { GameEngine } from '@js/Game/GameEngine.js';
import { GameRenderer } from '@js/Game/GameRenderer.js';
import { KeyboardHandler } from '@js/handlers/keyboardHandler.js';
import { TouchHandler } from '@js/handlers/touchHandler.js';
import { formatTime } from '@js/utils/timeFormat.js';
import { BackgroundManager } from '@js/utils/background.js';

/**
 * 游戏控制器 - 连接引擎和渲染器
 */
export class GameController {
  constructor() {
    this.engine = new GameEngine();
    this.renderer = new GameRenderer();
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);

    this._bindEvents();
    this._initializeHandlers();

    // 传递等级分系统引用到渲染器
    this.renderer.setRatingSystem(this.engine.ratingSystem);

    // 设置随机背景
    this._setRandomBackground();

    console.log('[GameController] 初始化完成');
  }

  // 公共接口 - 供Handler调用
  handleColumnInput(column) {
    this.engine.handleInput(column);
  }

  switchGameTime() {
    const newTime = this.engine.switchGameTime();
    if (newTime) {
      this.renderer.showTimeNotification(formatTime(newTime));
    }
    return newTime;
  }

  switchGameMode() {
    const mode = this.engine.switchGameMode();
    if (mode) {
      this.renderer.showModeNotification(mode.name);
    }
    return mode;
  }

  switchTheme() {
    const themeName = this.renderer.switchTheme();
    this.renderer.render(this.engine.getGameState());
    return themeName;
  }

  toggleFocusMode() {
    const result = this.engine.toggleFocusMode();
    return result;
  }

  init() {
    this.engine.reset();
  }

  // 私有方法
  _bindEvents() {
    // 状态变化 -> 重新渲染
    this.engine.on('stateChanged', (state) => {
      this.renderer.render(state);
    });

    // 游戏开始
    this.engine.on('gameStarted', (state) => {
      this.renderer.render(state);
    });

    // 游戏结束
    this.engine.on('gameEnded', (data) => {
      this._saveGameHistory(data);
      this.renderer.showGameOver(data);
    });

    // 游戏重置
    this.engine.on('gameReset', (state) => {
      this.renderer.render(state);
      this.renderer.hideGameOver();
    });

    // 命中事件
    this.engine.on('hit', (data) => {
      this.renderer.showScoreFeedback(data.scoreDetails, data.column);
      if (data.scoreDetails.details.milestoneBonus > 0) {
        this.renderer.showComboMilestone(
          data.stats.currentCombo,
          data.scoreDetails.details.milestoneBonus
        );
      }
    });

    // 失误事件
    this.engine.on('miss', (data) => {
      this.renderer.showScoreFeedback(data.scoreDetails);
      if (data.scoreDetails.details.comboPenalty > 0) {
        this.renderer.showComboBreak(
          data.stats.currentCombo,
          data.scoreDetails.details.comboPenalty
        );
      }
    });

    // 专注模式变化
    this.engine.on('focusModeChanged', (isFocusMode) => {
      this.renderer.updateFocusMode(isFocusMode);
    });

    // 修复：直接调用UI管理器的方法
    this.engine.on('timerTick', (timeLeft) => {
      this.renderer.uiManager.updateTimer(timeLeft);
    });

    // 修复：直接调用UI管理器的方法
    this.engine.on('ratingUpdated', (ratingResult) => {
      this.renderer.uiManager.updateRating(
        this.engine.ratingSystem.getRating()
      );
      this.renderer.handleLevelChange(ratingResult);
    });
  }

  _initializeHandlers() {
    this.keyboardHandler.init();
    this.touchHandler.init();

    // 绑定重启按钮
    this.renderer.bindRestartButton(() => this.init());
  }

  _saveGameHistory(data) {
    const { stats, score } = data;
    const modeType = this.engine.modeManager.getCurrentMode().type;
    const duration = this.engine.timeLeft;

    if (stats && score !== undefined && modeType) {
      this.renderer.updateGameHistory(duration, modeType, stats, score);
    }
  }

  // 设置随机背景
  async _setRandomBackground() {
    try {
      await BackgroundManager.setRandomBackground();
      console.log('[GameController] 随机背景设置成功');
    } catch (error) {
      console.warn('[GameController] 设置随机背景失败:', error);
      // 背景设置失败不影响游戏正常运行
    }
  }

  destroy() {
    this.engine.destroy();
    this.keyboardHandler.cleanup();
    this.touchHandler.cleanup();
    this.renderer.unbindRestartButton();
  }
}
