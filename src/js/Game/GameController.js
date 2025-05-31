import { GameEngine } from '@js/Game/GameEngine.js';
import { GameRenderer } from '@js/Game/GameRenderer.js';
import { KeyboardHandler } from '@js/handlers/keyboardHandler.js';
import { TouchHandler } from '@js/handlers/touchHandler.js';
import { BackgroundManager } from '@js/utils/background.js';

/**
 * 游戏控制器 - 负责输入处理和游戏流程控制
 */
export class GameController {
  constructor() {
    console.log('[GameController] 初始化');
    this.engine = new GameEngine();
    this.renderer = new GameRenderer(this.engine);

    // 设置双向引用
    this.engine.setRenderer(this.renderer);

    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);

    void BackgroundManager.setRandomBackground();
  }

  init() {
    console.log('[GameController] 启动游戏');
    this.cleanup();
    this.engine.reset();
    this.renderer.initialize();
    this.initEventListeners();
    this.renderer.markAsLoaded();
  }

  // === 输入处理 ===
  handleColumnInput(column) {
    if (this.engine.isGameOver()) return;

    requestAnimationFrame(() => {
      const result = this.engine.processInput(column);
      this.renderer.update(result);
    });
  }

  toggleFocusMode() {
    if (this.engine.isGameRunning()) {
      console.log('[GameController] 游戏进行中，无法切换专注模式');
      return this.engine.statsManager.focusMode;
    }

    const isFocusMode = this.engine.statsManager.toggleFocusMode();
    this.renderer.updateFocusMode(isFocusMode);

    // 添加专注模式切换通知
    this.renderer.uiManager.showFocusModeNotification(isFocusMode);

    return isFocusMode;
  }

  switchGameTime() {
    if (!this.engine.canSwitchSettings()) return;

    const newTime = this.engine.switchGameTime();
    if (newTime) {
      this.renderer.uiManager.updateTimer(this.engine.getTimeLeft());
      this.renderer.notificationSystem.showTimeNotification(newTime);
    }
  }

  switchGameMode() {
    if (!this.engine.canSwitchSettings()) return;

    const mode = this.engine.modeManager.switchMode();
    this.renderer.notificationSystem.showModeNotification(mode.name);
    this.renderer.uiManager.updateMode(this.engine.modeManager.getModeName());
  }

  switchTheme() {
    const themeName = this.renderer.themeManager.switchTheme();
    this.renderer.boardView.setThemeIndex(
      this.renderer.themeManager.getCurrentThemeIndex()
    );
    this.renderer.renderBoard();
    this.renderer.notificationSystem.showThemeNotification(themeName);
  }

  // === 事件监听 ===
  initEventListeners() {
    this.keyboardHandler.init();
    this.touchHandler.init();
    this.renderer.uiManager.bindRestartButton(() => this.init());
  }

  cleanup() {
    this.engine.cleanup();
    this.keyboardHandler.cleanup();
    this.touchHandler.cleanup();
    this.renderer.cleanup();
  }

  // === 状态访问（供handlers使用）===
  get state() {
    return {
      isOver: () => this.engine.isGameOver(),
      canSwitchSettings: () => this.engine.canSwitchSettings(),
    };
  }

  get statsManager() {
    return {
      focusMode: this.engine.statsManager.focusMode,
      updateLastActionTime: () =>
        this.engine.statsManager.updateLastActionTime(),
    };
  }
}
