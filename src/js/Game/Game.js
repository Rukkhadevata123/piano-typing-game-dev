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

export class Game {
  constructor() {
    console.log('[Game] Constructor 开始初始化');
    this.modeManager = new ModeManager();
    this.state = new GameState(this.modeManager);
    this.board = new Board(this.state.difficultyManager);
    this.view = new GameView(this.board);
    this.scoreManager = new ScoreManager();
    this.statsManager = new StatsManager();
    this.historyManager = new HistoryManager();
    this.keyboardHandler = new KeyboardHandler(this);
    this.touchHandler = new TouchHandler(this);
    this.handleRestart = this.init.bind(this);
    this.bindEventHandlers();
    console.log('[Game] Constructor 初始化完成');
  }

  bindEventHandlers() {
    console.log('[Game] 开始绑定事件处理函数');
    this.scoreChangeHandler = (score) => {
      console.log(`[Game] 分数更新: ${score}`);
      this.view.updateScore(score);
    };

    this.statsChangeHandler = () => {
      const stats = this.statsManager.getStats();
      console.log(`[Game] 统计更新: `, stats);
      this.view.updateStats(stats);
    };

    this.scoreManager.onScoreChange = this.scoreChangeHandler;
    this.statsManager.onStatsChange = this.statsChangeHandler;
    this.view.bindRestartButton(this.handleRestart);
    console.log('[Game] 事件处理函数绑定完成');
  }

  init() {
    console.log('[Game] init() 开始初始化游戏');
    try {
      // 在初始化前先移除所有事件监听器
      console.log('[Game] 清理旧事件监听器');
      this.cleanup();

      // 重置游戏状态
      console.log('[Game] 重置游戏状态');
      this.resetGameState();
      this.initializeUI();

      // 重新绑定事件监听器
      console.log('[Game] 重新绑定事件监听器');
      this.initEventListeners();
      this.bindEventHandlers();

      // 标记游戏加载完成
      console.log('[Game] 标记游戏加载完成');
      this.view.markGameAsLoaded();
      console.log('[Game] 游戏初始化完成');
    } catch (error) {
      console.error('[Game] 游戏初始化失败:', error);
      throw error;
    }
  }

  resetGameState() {
    // 确保在重置前保存当前时间设置
    const currentTimeIndex = this.state.getCurrentTimeIndex();
    console.log(`[Game] 重置前的时间索引: ${currentTimeIndex}`);

    this.state.reset();
    this.board.initialize();
    this.scoreManager.reset();
    this.statsManager.reset();

    // 使用保存的时间设置
    console.log(`[Game] 使用时间索引: ${currentTimeIndex}`);
    this.state.currentTimeIndex = currentTimeIndex;
    console.log(`[Game] 设置剩余时间: ${this.state.timeLeft}`);
    this.view.updateTimer(this.state.timeLeft);
  }

  initializeUI() {
    console.log('[Game] 初始化UI');
    this.view.renderBoard();
    this.view.updateMode(this.modeManager.getModeName());
    this.view.updateTimer(this.state.timeLeft);
    this.view.updateStats(this.statsManager.getStats());
    this.view.updateScore(this.scoreManager.getScore());
    this.view.hideGameOver();
  }

  handleColumnInput(column) {
    console.log(`[Game] 处理列输入: ${column}`);
    if (this.state.isOver()) {
      console.log('[Game] 游戏已结束，忽略输入');
      return;
    }

    const lastRow = gameConfig.rows - 1;
    const isHit = this.board.getCell(lastRow, column) === 1;
    console.log(`[Game] 是否命中: ${isHit}`);

    isHit ? this.handleHit(column) : this.handleMiss();
    this.updateGameView();
  }

  handleHit(column) {
    console.log(`[Game] 处理命中: 列=${column}`);
    this.board.setCell(gameConfig.rows - 1, column, 0);
    this.scoreManager.increase(gameConfig.points.hit);
    playSound('tap');
    this.statsManager.update(true);

    if (!this.state.isGameRunning()) {
      console.log('[Game] 首次命中，启动游戏计时器');
      this.startGameTimer();
    }
    this.handleDrop(column);
  }

  handleMiss() {
    console.log('[Game] 处理未命中');
    this.scoreManager.increase(gameConfig.points.miss);
    playSound('error');
    this.statsManager.update(false);
  }

  startGameTimer() {
    console.log('[Game] 启动游戏计时器');
    this.state.activateTimer(
      (timeLeft) => {
        console.log(`[Game] 倒计时: ${timeLeft}`);
        this.view.updateTimer(timeLeft);
      },
      () => {
        console.log('[Game] 计时结束，游戏结束');
        const stats = this.statsManager.getStats();
        const score = this.scoreManager.getScore();
        console.log('[Game] 最终统计:', stats);
        console.log('[Game] 最终分数:', score);
        this.endGame(stats, score);
      }
    );
  }

  handleDrop(column) {
    console.log(`[Game] 处理方块下落: 列=${column}`);
    this.state.difficultyManager.randomizeDifficulty();
    requestAnimationFrame(() => {
      if (this.modeManager.isRowMode()) {
        console.log('[Game] 使用行模式下落');
        this.handleRowDrop();
      } else {
        console.log('[Game] 使用列模式下落');
        this.handleColumnDrop(column);
      }
      this.view.renderBoard();
    });
  }

  handleRowDrop() {
    if (this.board.isRowEmpty(gameConfig.rows - 1)) {
      console.log('[Game] 最后一行为空，下落所有行');
      this.board.dropAllRows();
    } else {
      console.log('[Game] 最后一行不为空，不执行行下落');
    }
  }

  handleColumnDrop(column) {
    console.log(`[Game] 执行列下落: 列=${column}`);
    this.board.dropSingleColumn(column);
  }

  updateGameView() {
    console.log('[Game] 更新游戏视图');
    this.view.renderBoard();
    const stats = this.statsManager.getStats();
    console.log('[Game] 更新统计:', stats);
    this.view.updateStats(stats);
    const score = this.scoreManager.getScore();
    console.log('[Game] 更新分数:', score);
    this.view.updateScore(score);
  }

  switchGameTime() {
    console.log('[Game] 切换游戏时间');
    const newTime = this.state.switchGameTime();
    if (newTime) {
      console.log(
        `[Game] 新时间设置: ${newTime}, 当前索引: ${this.state.currentTimeIndex}`
      );
      console.log(`[Game] 更新剩余时间: ${this.state.timeLeft}`);
      this.view.updateTimer(this.state.timeLeft);
      NotificationManager.showTime(newTime);

      // 确保在非游戏状态下保存设置
      if (this.state.canSwitchSettings()) {
        console.log('[Game] 保存时间设置到存储');
        safeStorage.set('currentTimeIndex', this.state.getCurrentTimeIndex());
      }
    } else {
      console.log('[Game] 无法切换游戏时间，可能在游戏进行中');
    }
  }

  switchGameMode() {
    console.log('[Game] 尝试切换游戏模式');
    if (!this.state.canSwitchSettings()) {
      console.log('[Game] 游戏进行中，无法切换模式');
      return;
    }
    const mode = this.modeManager.switchMode();
    console.log(`[Game] 切换到新模式: ${mode.name}`);
    NotificationManager.showMode(mode.name);
    this.view.updateMode(this.modeManager.getModeName());
  }

  switchTheme() {
    console.log('[Game] 切换主题');
    const themeName = this.view.switchTheme();
    console.log(`[Game] 新主题: ${themeName}`);
    NotificationManager.showTheme(themeName);
  }

  endGame(stats, score) {
    console.log('[Game] 游戏结束', { stats, score });
    this.state.endGame(stats, score);
    this.scoreManager.saveHighScore();
    this.saveGameHistory(stats, score);
    playSound('gameOver');

    // 在显示结束统计前记录最大连击
    console.log('[Game] 显示最终统计，最大连击:', stats.maxCombo);
    this.view.showFinalStats(stats, score);
  }

  saveGameHistory(stats, score) {
    console.log('[Game] 保存游戏历史');
    const { type: modeType } = this.modeManager.getCurrentMode();
    const duration = gameConfig.timeDurations[this.state.getCurrentTimeIndex()];

    if (stats && score !== undefined && modeType) {
      // 创建一个深拷贝以确保数据安全传递
      const statsForHistory = {
        accuracy: stats.accuracy || 0,
        cps: stats.cps || 0,
        maxCombo: stats.maxCombo || 0, // 确保明确指定 maxCombo
        currentCombo: stats.currentCombo || 0,
      };

      // 记录日志确认数据正确
      console.log('[Game] 保存历史记录:', {
        duration,
        mode: modeType,
        stats: statsForHistory,
        score,
      });
      console.log(`[Game] 最大连击为: ${statsForHistory.maxCombo}`);

      this.historyManager.updateHistory(
        duration,
        modeType,
        statsForHistory,
        score
      );
    } else {
      console.warn('[Game] 无法保存历史记录，数据不完整', {
        stats,
        score,
        modeType,
      });
    }
  }

  initEventListeners() {
    console.log('[Game] 初始化事件监听器');
    this.keyboardHandler.init();
    this.touchHandler.init();
  }

  cleanup() {
    console.log('[Game] 清理资源和事件');
    // 确保清理所有事件监听器
    this.state.stopTimer();
    this.keyboardHandler.cleanup();
    this.touchHandler.cleanup();
    this.scoreManager.onScoreChange = null;
    this.statsManager.onStatsChange = null;
    this.view.unbindRestartButton();
  }

  isGameOver() {
    return this.state.isOver();
  }
}
