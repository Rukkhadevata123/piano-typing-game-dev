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
import { HistoryManager } from '@js/ui/history.js'; // 添加此行
import { safeStorage } from '@js/utils/safeStorage.js';

export class Game {
  constructor() {
    this.modeManager = new ModeManager();
    this.state = new GameState(this.modeManager); // 传入 modeManager
    this.board = new Board(this.state.difficultyManager);
    this.view = new GameView(this.board);
    this.scoreManager = new ScoreManager();
    this.statsManager = new StatsManager();
    this.historyManager = new HistoryManager(); // 添加此行
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);
    this.handleRestart = this.init.bind(this);
    this.bindEvents();
  }

  bindEvents() {
    // 使用实例属性存储回调函数引用
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
    try {
      // 确保清理旧状态
      this.cleanup();

      // 按正确顺序初始化
      this.state.reset();
      this.board.initialize();
      this.scoreManager.reset();
      this.statsManager.reset();

      // 更新UI
      this.view.renderBoard();
      this.view.updateMode(this.modeManager.getModeName());
      this.view.updateTimer(this.state.timeLeft);
      this.view.updateStats(this.statsManager.getStats());
      this.view.updateScore(this.scoreManager.getScore());
      this.view.hideGameOver();

      // 重新绑定事件
      this.bindEvents();
      this.initEventListeners();

      // 标记加载完成
      this.view.markGameAsLoaded();
      console.log('Game initialized successfully');
    } catch (error) {
      console.error('Game initialization failed:', error);
      throw error;
    }
  }

  handleColumnInput(column) {
    if (this.state.isOver()) return;
    const lastRow = gameConfig.rows - 1;

    if (this.board.getCell(lastRow, column) === 1) {
      this.board.setCell(lastRow, column, 0);
      this.scoreManager.increase(gameConfig.points.hit);
      playSound('tap');
      this.statsManager.update(true);

      // 确保游戏状态正确更新
      if (!this.state.isGameRunning()) {
        this.state.activateTimer(
          (timeLeft) => {
            this.view.updateTimer(timeLeft);
          },
          () => {
            const stats = this.statsManager.getStats();
            const finalScore = this.scoreManager.getScore();
            this.endGame(stats, finalScore);
          }
        );
      }
      this.handleDrop(column);
    } else {
      this.scoreManager.increase(gameConfig.points.miss);
      playSound('error');
      this.statsManager.update(false);
    }

    // 确保视图更新
    this.view.renderBoard();
    this.view.updateStats(this.statsManager.getStats());
    this.view.updateScore(this.scoreManager.getScore());
  }

  handleDrop(column) {
    this.state.difficultyManager.randomizeDifficulty();
    if (this.modeManager.isRowMode()) {
      if (this.board.isRowEmpty(gameConfig.rows - 1)) this.board.dropAllRows();
    } else {
      this.board.dropSingleColumn(column);
    }
    this.view.renderBoard();
  }

  switchGameTime() {
    const newTime = this.state.switchGameTime();
    if (newTime) {
      this.view.updateTimer(this.state.timeLeft); // 更新显示
      NotificationManager.showTime(newTime);
    }
  }

  switchGameMode() {
    if (!this.state.canSwitchSettings()) return;
    const newMode = this.modeManager.switchMode();
    this.view.updateMode(this.modeManager.getModeName()); // 使用简洁名称
    NotificationManager.showMode(newMode.name);
  }

  switchTheme() {
    const themeName = this.view.switchTheme();
    NotificationManager.showTheme(themeName);
  }

  endGame(stats, score) {
    this.state.endGame(stats, score);
    this.scoreManager.saveHighScore();

    const currentMode = this.modeManager.getCurrentMode();
    const duration = gameConfig.timeDurations[this.state.getCurrentTimeIndex()];

    // 添加防御性检查
    if (stats && score !== undefined && currentMode) {
      this.historyManager.updateHistory(
        duration,
        currentMode.type,
        stats,
        score
      );
    }

    playSound('gameOver');
    this.view.showFinalStats(stats, score);
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
    this.view.unbindRestartButton(this.handleRestart);

    // 保持主题和历史记录
    const currentTheme = safeStorage.get('currentTheme', '0');
    const gameHistory = safeStorage.get('gameHistory', []);
    const highScores = safeStorage.get('highScores', []);

    // 恢复存储
    safeStorage.set('currentTheme', currentTheme);
    safeStorage.set('gameHistory', gameHistory);
    safeStorage.set('highScores', highScores);
  }

  isGameOver() {
    return this.state.isOver();
  }
}
