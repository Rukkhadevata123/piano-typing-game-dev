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
    this.statsManager = new StatsManager();
    this.board = new Board(this.state.difficultyManager);
    this.view = new GameView(this.board);
    this.scoreManager = new ScoreManager();
    this.historyManager = new HistoryManager();
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);
    this.handleRestart = this.init.bind(this);

    // 注入 StatsManager 到 GameState 以同步状态
    this.state.setStatsManager(this.statsManager);

    // 绑定连击中断事件处理器
    this.statsManager.onComboBreak = (combo) => {
      console.log(`[Game] 连击中断: ${combo}`);
      // 可以在这里添加额外的游戏反馈，如震动效果等
    };
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

  // 优化命中处理函数
  handleHit(column) {
    this.board.setCell(gameConfig.rows - 1, column, 0);

    // 先更新统计数据，保证连击计数准确
    this.statsManager.update(true);

    // 获取更新后的统计数据
    const stats = this.statsManager.getStats();
    const timeLeft = this.state.timeLeft;
    const totalTime =
      gameConfig.timeDurations[this.state.getCurrentTimeIndex()];
    // 使用更新后的统计数据计算得分
    const scoreDetails = this.scoreManager.calculateScore(
      true,
      stats,
      timeLeft,
      totalTime
    );

    // 播放音效
    void playSound('tap');

    // 首次命中时启动计时器
    if (!this.state.isGameRunning()) {
      this.startGameTimer();
    }
    // 处理方块下落
    this.handleDrop(column);

    // 里程碑奖励处理
    if (scoreDetails.details.milestoneBonus > 0) {
      this.view.showComboMilestone(
        stats.currentCombo,
        scoreDetails.details.milestoneBonus
      );
      // 普通分数反馈时不显示连击信息，避免重复
      const feedbackDetails = { ...scoreDetails };
      feedbackDetails.details.milestoneBonus = 0;

      // 显示常规分数反馈
      this.view.showScoreFeedback(feedbackDetails, column);
    } else {
      // 直接显示常规分数反馈
      this.view.showScoreFeedback(scoreDetails, column);
    }
  }

  // 优化失误处理函数
  handleMiss() {
    // 获取当前统计
    const stats = this.statsManager.getStats();
    const timeLeft = this.state.timeLeft;
    const totalTime =
      gameConfig.timeDurations[this.state.getCurrentTimeIndex()];

    // 计算得分（必须在statsManager.update前计算，确保正确的连击数）
    const scoreDetails = this.scoreManager.calculateScore(
      false,
      stats,
      timeLeft,
      totalTime
    );

    // 播放音效
    void playSound('error');

    // 特殊处理连击中断
    const hasSignificantCombo = stats.currentCombo > 5;
    const hasComboPenalty = scoreDetails.details.comboPenalty > 0;

    if (hasSignificantCombo && hasComboPenalty) {
      // 连击中断通知
      this.view.showComboBreak(
        stats.currentCombo,
        scoreDetails.details.comboPenalty
      );
    }

    // 更新统计数据（重置连击）
    this.statsManager.update(false);

    // 显示失误得分反馈
    this.view.showScoreFeedback(scoreDetails);
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
    if (this.updatePending) return;

    this.updatePending = true;
    requestAnimationFrame(() => {
      this.view.renderBoard();

      // 以相同顺序更新UI元素，避免布局跳动
      const stats = this.statsManager.getStats();
      this.view.updateStats(stats);

      const score = this.scoreManager.getScore();
      const details = this.scoreManager.getLastScoreDetails();
      this.view.updateScore(score, details);

      this.updatePending = false;
    });
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

    const duration = gameConfig.timeDurations[this.state.getCurrentTimeIndex()];
    this.saveGameHistory(stats, score);

    void playSound('gameOver');
    this.view.showFinalStats(stats, score, duration);
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
