import { Board } from '@js/core/board.js';
import { ModeManager } from '@js/core/modes.js';
import { ScoreManager } from '@js/core/score/ScoreManager.js';
import { StatsManager } from '@js/core/stats/StatsManager.js';
import { KeyboardHandler } from '@js/handlers/keyboardHandler.js';
import { TouchHandler } from '@js/handlers/touchHandler.js';
import { playSound } from '@js/utils/audio/sounds.js';
import { gameConfig } from '@js/config/gameConfig.js';
import { GameState } from '@js/Game/GameState.js';
import { GameView } from '@js/Game/GameView.js';
import { NotificationManager } from '@js/ui/notifications.js';
import { HistoryManager } from '@js/ui/history.js';
import { safeStorage } from '@js/utils/safeStorage.js';
import { BackgroundManager } from '@js/utils/background.js';

export class Game {
  constructor() {
    console.log('[Game] 初始化');
    this.initializeComponents();
    this.bindEventHandlers();
    void BackgroundManager.setRandomBackground();
  }

  initializeComponents() {
    this.modeManager = new ModeManager();
    this.state = new GameState();
    this.board = new Board(this.state.difficultyManager);
    this.view = new GameView(this.board);
    this.scoreManager = new ScoreManager();
    this.statsManager = new StatsManager();
    this.historyManager = new HistoryManager();
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);
    this.handleRestart = this.init.bind(this);
  }

  bindEventHandlers() {
    this.scoreChangeHandler = (score) => {
      this.view.updateScore(score);
    };

    this.statsChangeHandler = () => {
      this.view.updateStats(this.statsManager.getStats());
    };

    this.scoreManager.onScoreChange = this.scoreChangeHandler;
    this.statsManager.onStatsChange = this.statsChangeHandler;
    this.view.bindRestartButton(this.handleRestart);
  }

  init() {
    this.cleanup();
    this.resetGameState();
    this.initializeUI();
    this.initEventListeners();
    this.bindEventHandlers();
    this.view.markGameAsLoaded();
  }

  resetGameState() {
    const currentTimeIndex = this.state.getCurrentTimeIndex();
    this.state.reset();
    this.board.initialize();
    this.scoreManager.reset();
    this.statsManager.reset();
    this.state.currentTimeIndex = currentTimeIndex;
    this.view.updateTimer(this.state.timeLeft);
  }

  initializeUI() {
    this.view.renderBoard();
    this.view.updateMode(this.modeManager.getModeName());
    this.view.updateTimer(this.state.timeLeft);
    this.view.updateStats(this.statsManager.getStats());
    this.view.updateScore(this.scoreManager.getScore());
    this.view.hideGameOver();
  }

  handleColumnInput(column) {
    if (this.state.isOver()) return;

    // 使用 requestAnimationFrame 确保动画同步
    requestAnimationFrame(() => {
      const isHit = this.board.getCell(gameConfig.rows - 1, column) === 1;
      if (isHit) {
        this.handleHit(column);
      } else {
        this.handleMiss();
      }
      this.updateGameView();
    });
  }

  handleHit(column) {
    this.board.setCell(gameConfig.rows - 1, column, 0);
    this.scoreManager.increase(gameConfig.points.hit);
    void playSound('tap');
    this.statsManager.update(true);

    if (!this.state.isGameRunning()) {
      this.startGameTimer();
    }
    this.handleDrop(column);
  }

  handleMiss() {
    this.scoreManager.increase(gameConfig.points.miss);
    void playSound('error');
    this.statsManager.update(false);
  }

  startGameTimer() {
    this.state.activateTimer(
      (timeLeft) => this.view.updateTimer(timeLeft),
      () => {
        const stats = this.statsManager.getStats();
        const score = this.scoreManager.getScore();
        this.endGame(stats, score);
      }
    );
  }

  handleDrop(column) {
    this.state.difficultyManager.randomizeDifficulty();
    requestAnimationFrame(() => {
      this.modeManager.isRowMode()
        ? this.handleRowDrop()
        : this.handleColumnDrop(column);
      this.view.renderBoard();
    });
  }

  handleRowDrop() {
    if (this.board.isRowEmpty(gameConfig.rows - 1)) {
      this.board.dropAllRows();
    }
  }

  handleColumnDrop(column) {
    this.board.dropSingleColumn(column);
  }

  updateGameView() {
    // 使用节流避免过频渲染
    if (!this.updatePending) {
      this.updatePending = true;
      requestAnimationFrame(() => {
        this.view.renderBoard();
        this.view.updateStats(this.statsManager.getStats());
        this.view.updateScore(this.scoreManager.getScore());
        this.updatePending = false;
      });
    }
  }

  switchGameTime() {
    const newTime = this.state.switchGameTime();
    if (newTime) {
      this.view.updateTimer(this.state.timeLeft);
      NotificationManager.showTime(newTime);

      if (this.state.canSwitchSettings()) {
        safeStorage.set('currentTimeIndex', this.state.getCurrentTimeIndex());
      }
    }
  }

  switchGameMode() {
    if (!this.state.canSwitchSettings()) return;

    const mode = this.modeManager.switchMode();
    NotificationManager.showMode(mode.name);
    this.view.updateMode(this.modeManager.getModeName());
  }

  switchTheme() {
    const themeName = this.view.switchTheme();
    NotificationManager.showTheme(themeName);
  }

  endGame(stats, score) {
    this.state.endGame(stats, score);
    this.scoreManager.saveHighScore();
    this.saveGameHistory(stats, score);
    void playSound('gameOver');
    this.view.showFinalStats(stats, score);
  }

  saveGameHistory(stats, score) {
    const { type: modeType } = this.modeManager.getCurrentMode();
    const duration = gameConfig.timeDurations[this.state.getCurrentTimeIndex()];

    if (stats && score !== undefined && modeType) {
      this.historyManager.updateHistory(duration, modeType, stats, score);
    }
  }

  initEventListeners() {
    this.keyboardHandler.init();
    this.touchHandler.init();
  }

  cleanup() {
    this.state.stopTimer();
    this.keyboardHandler.cleanup();
    this.touchHandler.cleanup();
    this.scoreManager.onScoreChange = null;
    this.statsManager.onStatsChange = null;
    this.view.unbindRestartButton();
  }
}
