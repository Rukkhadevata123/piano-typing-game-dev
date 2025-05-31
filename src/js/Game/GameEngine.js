import { Board } from '@js/core/board.js';
import { ModeManager } from '@js/core/modes.js';
import { ScoreManager } from '@js/core/score/ScoreManager.js';
import { StatsManager } from '@js/core/stats/StatsManager.js';
import { RatingSystem } from '@js/core/rating/RatingSystem.js';
import { DifficultyManager } from '@js/core/difficulty.js';
import { gameConfig } from '@js/config/gameConfig.js';
import { playSound } from '@js/utils/audio/sounds.js';
import { safeStorage } from '@js/utils/safeStorage.js';

/**
 * 游戏引擎 - 纯逻辑处理，不直接操作UI
 */
export class GameEngine {
  constructor() {
    this.difficultyManager = new DifficultyManager();
    this.board = new Board(this.difficultyManager);
    this.scoreManager = new ScoreManager();
    this.statsManager = new StatsManager();
    this.modeManager = new ModeManager();
    this.ratingSystem = new RatingSystem();

    this.gameTimer = null;
    this.listeners = new Map(); // 事件监听器
    this.currentTimeIndex = parseInt(safeStorage.get('currentTimeIndex', '0'));

    this._setupStatsManagerCallbacks();
    this.reset();
  }

  // 事件系统
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((callback) => callback(data));
  }

  // 游戏状态
  getGameState() {
    const stats = this.statsManager.getStats();
    const currentMultiplier = this.scoreManager.getCurrentMultiplier(
      stats,
      this.timeLeft,
      gameConfig.time.options[this.currentTimeIndex]
    );

    return {
      board: this.board.getRenderData(),
      score: this.scoreManager.getScore(),
      stats: stats,
      timer: this.timeLeft,
      mode: this.modeManager.getModeName(),
      isPlaying: this.isPlaying,
      isOver: this.isGameOver,
      rating: this.ratingSystem.getRating(),
      multiplier: currentMultiplier, // 🔧 新增：当前倍率
    };
  }

  // 游戏操作
  handleInput(column) {
    if (this.isGameOver || !this.isInitialized) return;

    const isHit = this.board.getCell(gameConfig.board.rows - 1, column) === 1;

    if (isHit) {
      this._processHit(column);
    } else {
      this._processMiss();
    }

    // 发送状态更新事件
    this.emit('stateChanged', this.getGameState());
  }

  switchGameTime() {
    if (this.isPlaying) return false;

    this.currentTimeIndex =
      (this.currentTimeIndex + 1) % gameConfig.time.options.length;
    this.timeLeft = gameConfig.time.options[this.currentTimeIndex];
    safeStorage.set('currentTimeIndex', this.currentTimeIndex);

    this.emit('stateChanged', this.getGameState());
    return this.timeLeft;
  }

  switchGameMode() {
    if (this.isPlaying) return false;

    const mode = this.modeManager.switchMode();
    this.emit('stateChanged', this.getGameState());
    return mode;
  }

  toggleFocusMode() {
    if (this.isPlaying) return this.statsManager.focusMode;

    const isFocusMode = this.statsManager.toggleFocusMode();
    this.emit('focusModeChanged', isFocusMode);
    return isFocusMode;
  }

  startGame() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.statsManager.startPlaying();
    this._startTimer();

    this.emit('gameStarted', this.getGameState());
  }

  endGame() {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.isPlaying = false;
    this.statsManager.stopPlaying();
    this._stopTimer();

    const finalState = this.getGameState();
    const ratingResult = this._updateRating();

    playSound('gameOver');
    this.emit('gameEnded', { ...finalState, ratingResult });
  }

  reset() {
    this._stopTimer();

    this.isPlaying = false;
    this.isGameOver = false;
    this.isInitialized = true;
    this.timeLeft = gameConfig.time.options[this.currentTimeIndex];

    this.board.initialize();
    this.scoreManager.reset();
    this.statsManager.reset();
    this.difficultyManager.reset();

    this.emit('gameReset', this.getGameState());
  }

  // 私有方法
  _setupStatsManagerCallbacks() {
    // 专注模式游戏结束回调
    this.statsManager.onFocusModeGameEnd = () => {
      console.log('[GameEngine] 专注模式导致游戏结束');
      this.endGame();
    };

    // 等级分更新回调
    this.ratingSystem.onRatingUpdated = (ratingResult) => {
      this.emit('ratingUpdated', ratingResult);
    };
  }

  _processHit(column) {
    this.board.setCell(gameConfig.board.rows - 1, column, 0);
    this.statsManager.recordHit();
    this.statsManager.update(true);

    const stats = this.statsManager.getStats();
    const scoreDetails = this.scoreManager.calculateScore(
      true,
      stats,
      this.timeLeft,
      gameConfig.time.options[this.currentTimeIndex]
    );

    this._handleDrop(column);
    playSound('tap');

    // 首次命中开始游戏
    if (!this.isPlaying) {
      this.startGame();
    }

    this.emit('hit', { column, scoreDetails, stats });
  }

  _processMiss() {
    const gameEndedByFocus = this.statsManager.recordMiss();
    if (gameEndedByFocus) {
      this.endGame();
      return;
    }

    const stats = this.statsManager.getStats();
    const scoreDetails = this.scoreManager.calculateScore(
      false,
      stats,
      this.timeLeft,
      gameConfig.time.options[this.currentTimeIndex]
    );

    this.statsManager.update(false);
    playSound('error');

    this.emit('miss', { scoreDetails, stats });
  }

  _handleDrop(column) {
    this.difficultyManager.randomizeDifficulty();

    if (this.modeManager.isRowMode()) {
      if (this.board.isRowEmpty(gameConfig.board.rows - 1)) {
        this.board.dropAllRows();
      }
    } else {
      this.board.dropSingleColumn(column);
    }
  }

  _startTimer() {
    this._stopTimer();

    const tick = () => {
      if (this.timeLeft <= 0) {
        this.endGame();
        return;
      }

      this.timeLeft--;
      this.emit('timerTick', this.timeLeft);
      this.gameTimer = setTimeout(tick, 1000);
    };

    tick();
  }

  _stopTimer() {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }

  _updateRating() {
    const gameData = {
      score: this.scoreManager.getScore(),
      duration: gameConfig.time.options[this.currentTimeIndex],
      stats: this.statsManager.getStats(),
      mode: this.modeManager.getCurrentMode().type,
    };

    return this.ratingSystem.updateRating(
      gameData,
      this.statsManager.focusMode
    );
  }

  destroy() {
    this._stopTimer();
    this.listeners.clear();
  }
}
