import { BoardView } from '@js/Game/views/BoardView.js';
import { NotificationSystem } from '@js/Game/views/NotificationSystem.js';
import { UIManager } from '@js/Game/views/UIManager.js';
import { ThemeManager } from '@js/Game/views/ThemeManager.js';

/**
 * 游戏视图 - 协调各个视图组件
 */
export class GameView {
  constructor(board) {
    console.log('[GameView] 初始化');
    this.board = board;

    // 初始化各子组件
    this.boardView = new BoardView(board);
    this.uiManager = new UIManager();
    this.notificationSystem = new NotificationSystem();
    this.themeManager = new ThemeManager();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    const theme = this.themeManager.applyCurrentTheme();
    this.boardView.setThemeIndex(this.themeManager.getCurrentThemeIndex());
  }

  // 代理方法 - 棋盘相关
  renderBoard() {
    const gameBoard = this.uiManager.getElementById('game-board');
    this.boardView.renderBoard(gameBoard);
  }

  // 代理方法 - UI相关
  updateScore(score, details) {
    this.uiManager.updateScore(score, details);
  }

  updateStats(stats) {
    this.uiManager.updateStats(stats);
  }

  updateTimer(timeLeft) {
    this.uiManager.updateTimer(timeLeft);
  }

  updateMode(modeText) {
    this.uiManager.updateMode(modeText);
  }

  showFinalStats(stats, finalScore, duration) {
    this.uiManager.showFinalStats(stats, finalScore, duration);
  }

  hideGameOver() {
    this.uiManager.hideGameOver();
  }

  markGameAsLoaded() {
    this.uiManager.markGameAsLoaded();
  }

  bindRestartButton(handler) {
    this.uiManager.bindRestartButton(handler);
  }

  unbindRestartButton() {
    this.uiManager.unbindRestartButton();
  }

  // 代理方法 - 通知相关
  showScoreFeedback(scoreDetails, column = null) {
    const scoreElement = this.uiManager.getElementById('score');
    const gameBoard = this.uiManager.getElementById('game_board');
    this.notificationSystem.showScoreFeedback(
      scoreDetails,
      column,
      scoreElement,
      gameBoard
    );
  }

  showComboMilestone(combo, points) {
    this.notificationSystem.showComboMilestone(combo, points);
  }

  showComboBreak(combo, penalty) {
    this.notificationSystem.showComboBreak(combo, penalty);
  }

  // 代理方法 - 主题相关
  switchTheme() {
    const themeName = this.themeManager.switchTheme();
    this.boardView.setThemeIndex(this.themeManager.getCurrentThemeIndex());
    this.renderBoard();
    return themeName;
  }

  // 辅助方法
  getElementById(id) {
    return this.uiManager.getElementById(id);
  }
}
