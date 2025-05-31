import { keyMap } from '@js/config/keyMap.js';

export class KeyboardHandler {
  constructor(gameController) {
    this.gameController = gameController;
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  init() {
    document.addEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    const key = event.key.toUpperCase();

    // 添加F键切换专注模式
    if (key === 'F') {
      // 阻止默认行为，避免键入字段获取焦点影响
      event.preventDefault();
      this.gameController.toggleFocusMode();
      return;
    }

    if (key === 'T') {
      this.gameController.switchTheme();
      return;
    }

    // Q/R键切换设置（只在非游戏状态下可用）
    if ((key === 'Q' || key === 'R') && !this.gameController.engine.isPlaying) {
      if (key === 'Q') this.gameController.switchGameTime();
      else this.gameController.switchGameMode();
      return;
    }

    // 空格键重新开始游戏
    if (key === ' ' || key === 'SPACE') {
      event.preventDefault();
      if (this.gameController.engine.isGameOver) {
        this.gameController.init(); // 游戏结束状态下重新开始游戏
        return;
      }
    }

    // 游戏结束时不处理列输入
    if (this.gameController.engine.isGameOver) return;

    const column = keyMap[key];
    if (typeof column === 'number') {
      // 更新最后操作时间（专注模式）
      if (this.gameController.engine.statsManager.focusMode) {
        this.gameController.engine.statsManager.updateLastActionTime();
      }
      this.gameController.handleColumnInput(column);
    }
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }
}
