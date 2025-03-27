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
import { RatingSystem } from '@js/core/rating/RatingSystem.js';

export class Game {
  constructor() {
    console.log('[Game] 初始化');
    this.initializeComponents();
    this.bindEventHandlers();
    void BackgroundManager.setRandomBackground();
  }

  initializeComponents(options = {}) {
    // 初始化所有实例，但留待后面设置依赖关系
    this.ratingSystem = options.ratingSystem || new RatingSystem();
    this.modeManager = options.modeManager || new ModeManager();
    this.state = options.state || new GameState();
    this.statsManager = options.statsManager || new StatsManager();
    this.board = options.board || new Board(this.state.difficultyManager);
    this.view = options.view || new GameView(this.board);
    this.scoreManager = options.scoreManager || new ScoreManager();
    this.historyManager = new HistoryManager();
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);

    // 重要：设置正确的依赖关系
    this.view.setGame(this);
    this.state.setStatsManager(this.statsManager);

    // 设置专注模式游戏结束回调
    this.statsManager.onFocusModeGameEnd = (reason) => {
      console.log(
        `[Game] 由于专注模式${reason === 'timeout' ? '超时' : '连续失误'}结束游戏`
      );

      // 获取当前统计和分数
      const stats = this.statsManager.getStats();
      const score = this.scoreManager.getScore();

      // 调用结束游戏方法
      this.endGame(stats, score);
    };

    this.handleRestart = this.init.bind(this);

    // 显示当前等级分（在设置完依赖后）
    this.showCurrentRating();

    // 绑定等级分详情按钮，处理可能的初始化和重新绑定情况
    this.bindRatingDetailsButton();

    // 保存当前等级以便检测变化
    this.currentLevel = this.ratingSystem.calculateLevel(
      this.ratingSystem.currentRating
    );

    // 添加等级分更新事件监听
    this.ratingSystem.onRatingUpdated = (ratingResult) => {
      console.log('[Game] 等级分已更新，立即刷新显示:', ratingResult);

      // 检查等级是否变化
      const newRatingData = this.ratingSystem.getRating();
      const oldLevel = this.currentLevel;
      const newLevel = newRatingData.level;

      // 更新显示
      this.view.updateRating(newRatingData);

      // 重新绑定等级分按钮
      this.bindRatingDetailsButton();

      // 如果段位有变化
      if (oldLevel.name !== newLevel.name) {
        // 判断是提升还是下降
        const isLevelUp = this.ratingSystem.isLevelHigher(newLevel, oldLevel);

        if (isLevelUp) {
          // 段位提升
          this.view.uiManager.showLevelChangeAnimation(
            oldLevel,
            newLevel,
            true
          );
          // 播放晋升音效
          // void playSound('levelUp');
        } else {
          // 段位下降
          this.view.uiManager.showLevelChangeAnimation(
            oldLevel,
            newLevel,
            false
          );
          // 播放下降音效 (可选)
          // void playSound('levelDown');
        }

        // 更新当前等级
        this.currentLevel = newLevel;
      }
    };

    // 绑定连击事件处理
    this.statsManager.onComboBreak = (combo) => {
      console.log(`[Game] 连击中断: ${combo}`);
    };
  }

  showCurrentRating() {
    const ratingData = this.ratingSystem.getRating();
    this.view.updateRating(ratingData);

    // 使用委托绑定等级分按钮
    this.bindRatingDetailsButton();
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

  // 修改方法，使用更安全的事件绑定方式
  bindRatingDetailsButton() {
    // 委托给UIManager，避免逻辑重复
    if (this.view && this.view.uiManager) {
      this.view.uiManager.bindRatingDetailsButton();
    } else {
      console.warn('[Game] 无法绑定等级分详情按钮：UIManager未初始化');
    }
  }

  init() {
    this.cleanup();
    this.resetGameState();
    this.initializeUI();
    this.initEventListeners();
    this.bindEventHandlers();
    this.view.markGameAsLoaded();

    // 隐藏结束界面
    const gameOver = document.getElementById('game-over');
    if (gameOver) {
      gameOver.style.display = 'none';
      gameOver.classList.remove('show');

      // 重置预设的等级分容器
      const ratingContainer = document.getElementById('rating-container');
      if (ratingContainer) {
        ratingContainer.style.display = 'none';
      }
    }
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

  /**
   * 切换专注模式
   * @returns {boolean} 专注模式是否开启
   */
  toggleFocusMode() {
    // 如果游戏已经开始，不允许切换专注模式
    if (this.state.isGameRunning()) {
      console.log('[Game] 游戏进行中，无法切换专注模式');
      return this.statsManager.focusMode; // 返回当前状态，不做更改
    }

    // 改为调用statsManager的方法，而不是state
    const isFocusMode = this.statsManager.toggleFocusMode();

    // 更新UI反馈
    const gameTitle = document.querySelector('h1');
    if (gameTitle) {
      if (isFocusMode) {
        gameTitle.style.color = '#e74c3c'; // 红色标题
      } else {
        gameTitle.style.color = ''; // 恢复默认颜色
      }
    }

    return isFocusMode;
  }

  // 优化命中处理函数
  handleHit(column) {
    this.board.setCell(gameConfig.rows - 1, column, 0);

    // 先更新统计数据，保证连击计数准确
    this.statsManager.update(true);
    this.statsManager.recordHit();

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

    // 更新专注模式状态，如果返回true表示游戏结束
    const gameEndedByFocusMode = this.statsManager.recordMiss();
    if (gameEndedByFocusMode) {
      // 如果因专注模式失败，立即结束游戏
      // 修复：传递必要的参数
      const currentStats = this.statsManager.getStats();
      const currentScore = this.scoreManager.getScore();
      this.endGame(currentStats, currentScore);
      return;
    }

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

    // 添加这一行 - 告诉 StatsManager 游戏已经开始
    this.statsManager.startPlaying();
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

    // 添加这行 - 通知 StatsManager 停止游戏
    this.statsManager.stopPlaying();

    const duration = gameConfig.timeDurations[this.state.getCurrentTimeIndex()];
    this.saveGameHistory(stats, score);

    // 确保所有参数都正确传递
    const gameData = {
      score: score,
      duration: duration,
      stats: stats,
      mode: this.modeManager.getCurrentMode().type,
    };

    // 调试日志
    console.log('[Game] 游戏结束，调用等级分更新:', gameData);

    // 确保 ratingSystem 存在
    if (!this.ratingSystem) {
      console.error('[Game] 等级分系统未初始化!');
      this.view.showFinalStats(stats, score, duration);
      return;
    }

    // 获取等级分结果 - 传递statsManager中的focusMode状态
    const ratingResult = this.ratingSystem.updateRating(
      gameData,
      this.statsManager.focusMode // 正确传递专注模式状态
    );

    void playSound('gameOver');
    this.view.showFinalStats(stats, score, duration, ratingResult);
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
