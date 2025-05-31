import { BoardView } from '@js/Game/views/BoardView.js';
import { NotificationSystem } from '@js/Game/views/NotificationSystem.js';
import { UIManager } from '@js/Game/views/UIManager.js';
import { ThemeManager } from '@js/Game/views/ThemeManager.js';

export class GameRenderer {
  constructor() {
    this.boardView = new BoardView();
    this.uiManager = new UIManager();
    this.notificationSystem = new NotificationSystem();
    this.themeManager = new ThemeManager();

    this.lastState = null;
    this.currentLevel = null;
    this._initialize();
  }

  setRatingSystem(ratingSystem) {
    this.uiManager.setRatingSystem(ratingSystem);
  }

  render(gameState) {
    if (this._isSameState(gameState)) return;
    this.lastState = gameState;

    requestAnimationFrame(() => {
      this.boardView.renderBoard(this._getGameBoard(), gameState.board);
      this.uiManager.updateScore(gameState.score);
      this.uiManager.updateStats(gameState.stats);
      this.uiManager.updateTimer(gameState.timer);
      this.uiManager.updateMode(gameState.mode);
      this.uiManager.updateRating(gameState.rating);

      // 🔧 新增：更新倍率显示
      if (gameState.multiplier !== undefined) {
        this.uiManager.updateMultiplier(gameState.multiplier);
      }
    });
  }

  showGameOver(data) {
    this.uiManager.showFinalStats(
      data.stats,
      data.score,
      data.timer,
      data.ratingResult
    );
  }

  hideGameOver() {
    this.uiManager.hideGameOver();
  }

  showScoreFeedback(scoreDetails, column = null) {
    // 🔧 新增：显示倍率信息
    if (scoreDetails.details && scoreDetails.details.multiplier) {
      this.uiManager.updateMultiplier(
        scoreDetails.details.multiplier.toFixed(1)
      );
    }

    this.notificationSystem.showScoreFeedback(
      scoreDetails,
      column,
      this._getScoreElement(),
      this._getGameBoard()
    );
  }

  showComboMilestone(combo, points) {
    this.notificationSystem.showComboMilestone(combo, points);
  }

  showComboBreak(combo, penalty) {
    this.notificationSystem.showComboBreak(combo, penalty);
  }

  updateFocusMode(isFocusMode) {
    const gameTitle = document.querySelector('h1');
    if (gameTitle) gameTitle.style.color = isFocusMode ? '#e74c3c' : '';
    this.notificationSystem.showFocusMode(isFocusMode);
  }

  handleLevelChange(ratingResult) {
    if (!ratingResult.changed) return;

    const newLevel = ratingResult.level;
    if (this.currentLevel && this.currentLevel.name !== newLevel.name) {
      const isLevelUp = this._isLevelHigher(newLevel, this.currentLevel);
      this.uiManager.showLevelChangeAnimation(
        this.currentLevel,
        newLevel,
        isLevelUp
      );
    }
    this.currentLevel = newLevel;
  }

  switchTheme() {
    const themeName = this.themeManager.switchTheme();
    this.boardView.setThemeIndex(this.themeManager.getCurrentThemeIndex());
    this.lastState = null; // 清除缓存
    this.notificationSystem.showTheme(themeName);
    return themeName;
  }

  showTimeNotification(timeText) {
    this.notificationSystem.showTime(timeText);
  }

  showModeNotification(modeName) {
    this.notificationSystem.showMode(modeName);
  }

  updateGameHistory(duration, mode, stats, score) {
    this.uiManager.updateGameHistory(duration, mode, stats, score);
  }

  bindRestartButton(handler) {
    this.uiManager.bindRestartButton(handler);
  }

  unbindRestartButton() {
    this.uiManager.unbindRestartButton();
  }

  // 私有方法
  _initialize() {
    this.themeManager.applyCurrentTheme();
    this.boardView.setThemeIndex(this.themeManager.getCurrentThemeIndex());
    this.uiManager.markGameAsLoaded();
  }

  _isSameState(newState) {
    if (!this.lastState) return false;
    return (
      this.lastState.score === newState.score &&
      this.lastState.timer === newState.timer &&
      this.lastState.stats.currentCombo === newState.stats.currentCombo &&
      this.lastState.isPlaying === newState.isPlaying &&
      this.lastState.mode === newState.mode
    );
  }

  _isLevelHigher(levelA, levelB) {
    const levels = [
      '青铜等级',
      '白银等级',
      '黄金等级',
      '蓝宝石等级',
      '红宝石等级',
      '绿宝石等级',
      '紫水晶等级',
      '珍珠等级',
      '黑曜石等级',
      '钻石等级',
    ];
    return levels.indexOf(levelA.name) > levels.indexOf(levelB.name);
  }

  _getGameBoard() {
    return document.getElementById('game-board');
  }

  _getScoreElement() {
    return document.getElementById('score');
  }
}
