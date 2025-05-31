import { BoardView } from '@js/Game/views/BoardView.js';
import { NotificationSystem } from '@js/Game/views/NotificationSystem.js';
import { UIManager } from '@js/Game/views/UIManager.js';
import { ThemeManager } from '@js/Game/views/ThemeManager.js';

/**
 * 游戏渲染器 - 负责所有视图更新和渲染
 */
export class GameRenderer {
  constructor(engine) {
    console.log('[GameRenderer] 初始化');
    this.engine = engine;

    this.boardView = new BoardView(engine.board);
    this.uiManager = new UIManager();
    this.notificationSystem = new NotificationSystem();
    this.themeManager = new ThemeManager();

    // 设置依赖 - 简化设置
    this.uiManager.setRatingSystem(engine.ratingSystem);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initTheme());
    } else {
      this.initTheme();
    }
  }

  initTheme() {
    this.themeManager.applyCurrentTheme();
    this.boardView.setThemeIndex(this.themeManager.getCurrentThemeIndex());
  }

  initialize() {
    console.log('[GameRenderer] 初始化渲染');

    // 渲染游戏板
    this.renderBoard();

    // 初始化UI
    this.uiManager.updateMode(this.engine.modeManager.getModeName());
    this.uiManager.updateTimer(this.engine.getTimeLeft());
    this.uiManager.updateStats(this.engine.statsManager.getStats());
    this.uiManager.updateScore(this.engine.scoreManager.getScore());
    this.uiManager.updateRating(this.engine.getCurrentRating());

    this.uiManager.hideGameOver();
  }

  // === 核心渲染方法 ===
  update(result) {
    // 对于hit类型，立即渲染确保UI同步
    if (result.type === 'hit' && result.needsRender) {
      this.renderBoard();
    }

    switch (result.type) {
      case 'hit':
        this.handleHitResult(result);
        break;
      case 'miss':
        this.handleMissResult(result);
        break;
      case 'gameEnd':
        break;
    }

    // 对于miss类型，也要确保渲染（虽然通常board不变）
    if (result.type === 'miss' && result.needsRender) {
      this.renderBoard();
    }
  }

  handleHitResult(result) {
    if (result.comboMilestone) {
      this.notificationSystem.showComboMilestone(
        result.comboMilestone.combo,
        result.comboMilestone.points
      );

      // 显示常规分数反馈（不显示连击信息避免重复）
      const feedbackDetails = { ...result.scoreDetails };
      feedbackDetails.details.milestoneBonus = 0;
      this.showScoreFeedback(feedbackDetails, result.column);
    } else {
      this.showScoreFeedback(result.scoreDetails, result.column);
    }
  }

  handleMissResult(result) {
    if (result.comboBreak) {
      this.notificationSystem.showComboBreak(
        result.comboBreak.combo,
        result.comboBreak.penalty
      );
    }
    this.showScoreFeedback(result.scoreDetails);
  }

  renderBoard() {
    const gameBoard = this.uiManager.getElementById('game-board');
    this.boardView.renderBoard(gameBoard);
  }

  // === 通知方法 ===
  showScoreFeedback(scoreDetails, column = null) {
    const scoreElement = this.uiManager.getElementById('score');
    const gameBoard = this.uiManager.getElementById('game-board');
    this.notificationSystem.showScoreFeedback(
      scoreDetails,
      column,
      scoreElement,
      gameBoard
    );
  }

  updateFocusMode(isFocusMode) {
    const gameTitle = document.querySelector('h1');
    if (gameTitle) {
      gameTitle.style.color = isFocusMode ? '#e74c3c' : '';
    }
  }

  markAsLoaded() {
    this.uiManager.markGameAsLoaded();
  }

  // === 清理 ===
  cleanup() {
    this.uiManager.unbindRestartButton();
  }
}
