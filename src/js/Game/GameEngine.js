import { Board } from '@js/core/board.js';
import { ModeManager } from '@js/core/modes.js';
import { ScoreManager } from '@js/core/score/ScoreManager.js';
import { StatsManager } from '@js/core/stats/StatsManager.js';
import { RatingSystem } from '@js/core/rating/RatingSystem.js';
import { DifficultyManager } from '@js/core/difficulty.js';
import { gameConfig } from '@js/config/gameConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';
import { playSound } from '@js/utils/audio/sounds.js';

/**
 * 游戏引擎 - 核心游戏逻辑
 */
export class GameEngine {
  constructor() {
    console.log('[GameEngine] 初始化');

    // 初始化管理器
    this.difficultyManager = new DifficultyManager();
    this.board = new Board(this.difficultyManager);
    this.modeManager = new ModeManager();
    this.scoreManager = new ScoreManager();
    this.statsManager = new StatsManager();
    this.ratingSystem = new RatingSystem();

    // 游戏状态
    this.timeLeft = gameConfig.timeDurations[0];
    this.currentTimeIndex = parseInt(safeStorage.get('currentTimeIndex', '0'));
    this.gameOver = false;
    this.isPlaying = false;
    this.timer = null;
    this.renderer = null;

    this.setupCallbacks();
    this.setupRatingSystem();
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  setupCallbacks() {
    // 专注模式游戏结束
    this.statsManager.onFocusModeGameEnd = (reason) => {
      console.log(
        `[GameEngine] 专注模式${reason === 'timeout' ? '超时' : '连续失误'}结束游戏`
      );
      this.endGame();
    };

    // 分数变化
    this.scoreManager.onScoreChange = (score, details) => {
      this.renderer?.uiManager.updateScore(score, details);
    };

    // 统计变化
    this.statsManager.onStatsChange = () => {
      this.renderer?.uiManager.updateStats(this.statsManager.getStats());
    };
  }

  setupRatingSystem() {
    // 修复：需要先获取当前等级分
    const currentRating = this.ratingSystem.getRating();
    this.currentLevel = currentRating.level;

    this.ratingSystem.onRatingUpdated = () => {
      const newRatingData = this.ratingSystem.getRating();
      const oldLevel = this.currentLevel;
      const newLevel = newRatingData.level;

      this.renderer?.uiManager.updateRating(newRatingData);

      if (oldLevel.name !== newLevel.name) {
        const isLevelUp = this.ratingSystem.isLevelHigher(newLevel, oldLevel);
        this.renderer?.uiManager.showLevelChangeAnimation(
          oldLevel,
          newLevel,
          isLevelUp
        );
        this.currentLevel = newLevel;
      }
    };
  }

  // === 核心游戏逻辑 ===
  reset() {
    console.log('[GameEngine] 重置游戏');
    this.gameOver = false;
    this.isPlaying = false;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];

    this.stopTimer();
    this.board.initialize();
    this.scoreManager.reset();
    this.statsManager.reset();
    this.difficultyManager.reset();
  }

  processInput(column) {
    const isHit = this.board.getCell(gameConfig.rows - 1, column) === 1;

    if (isHit) {
      return this.handleHit(column);
    } else {
      return this.handleMiss();
    }
  }

  handleHit(column) {
    this.board.setCell(gameConfig.rows - 1, column, 0);

    // 更新统计
    this.statsManager.update(true);
    this.statsManager.recordHit();

    // 计算得分
    const stats = this.statsManager.getStats();
    const scoreDetails = this.scoreManager.calculateScore(
      true,
      stats,
      this.timeLeft,
      gameConfig.timeDurations[this.currentTimeIndex]
    );

    void playSound('tap');

    // 首次命中启动游戏
    if (!this.isPlaying) {
      this.startGame();
    }

    // 处理方块下落
    this.processBlockDrop(column);

    return {
      type: 'hit',
      column,
      scoreDetails,
      stats,
      needsRender: true,
      comboMilestone:
        scoreDetails.details.milestoneBonus > 0
          ? {
            combo: stats.currentCombo,
            points: scoreDetails.details.milestoneBonus,
          }
          : null,
    };
  }

  handleMiss() {
    void playSound('error');

    // 检查专注模式（在更新统计前检查）
    const gameEndedByFocus = this.statsManager.recordMiss();
    if (gameEndedByFocus) {
      this.endGame();
      return { type: 'gameEnd' };
    }

    // 在更新统计前获取当前统计信息（包括连击数）
    const statsBeforeUpdate = this.statsManager.getStats();

    // 计算得分（使用更新前的统计信息）
    const scoreDetails = this.scoreManager.calculateScore(
      false,
      statsBeforeUpdate,
      this.timeLeft,
      gameConfig.timeDurations[this.currentTimeIndex]
    );

    // 检查连击中断（使用更新前的连击数）
    const hasSignificantCombo = statsBeforeUpdate.currentCombo > 5;
    const hasComboPenalty = scoreDetails.details.comboPenalty > 0;

    // 更新统计（这会重置连击数为0）
    this.statsManager.update(false);

    // 获取更新后的统计信息
    const stats = this.statsManager.getStats();

    return {
      type: 'miss',
      scoreDetails,
      stats,
      comboBreak:
        hasSignificantCombo && hasComboPenalty
          ? {
            combo: statsBeforeUpdate.currentCombo,
            penalty: scoreDetails.details.comboPenalty,
          }
          : null,
    };
  }

  processBlockDrop(column) {
    this.difficultyManager.randomizeDifficulty();

    if (this.modeManager.isRowMode()) {
      if (this.board.isRowEmpty(gameConfig.rows - 1)) {
        this.board.dropAllRows();
      }
    } else {
      this.board.dropSingleColumn(column);
    }
  }

  startGame() {
    this.isPlaying = true;
    this.statsManager.startPlaying();
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();

    const tick = () => {
      if (this.timeLeft <= 0) {
        this.endGame();
        return;
      }

      this.timeLeft--;
      this.renderer?.uiManager.updateTimer(this.timeLeft);
      this.timer = setTimeout(tick, 1000);
    };

    tick();
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  endGame() {
    if (this.gameOver) return;

    console.log('[GameEngine] 游戏结束');
    this.gameOver = true;
    this.isPlaying = false;
    this.stopTimer();
    this.statsManager.stopPlaying();

    const stats = this.statsManager.getStats();
    const score = this.scoreManager.getScore();
    const duration = gameConfig.timeDurations[this.currentTimeIndex];

    this.scoreManager.saveHighScore();
    this.saveGameHistory(stats, score);

    // 更新等级分
    const gameData = {
      score,
      duration,
      stats,
      mode: this.modeManager.getCurrentMode().type,
    };

    const ratingResult = this.ratingSystem.updateRating(
      gameData,
      this.statsManager.focusMode
    );

    void playSound('gameOver');
    this.renderer?.uiManager.showFinalStats(
      stats,
      score,
      duration,
      ratingResult
    );
  }

  saveGameHistory(stats, score) {
    const { type: modeType } = this.modeManager.getCurrentMode();
    const duration = gameConfig.timeDurations[this.currentTimeIndex];

    if (stats && score !== undefined && modeType) {
      this.renderer?.uiManager.updateHistory(duration, modeType, stats, score);
    }
  }

  // === 模式切换 ===
  switchGameTime() {
    if (!this.canSwitchSettings()) return null;

    this.currentTimeIndex =
      (this.currentTimeIndex + 1) % gameConfig.timeDurations.length;
    this.timeLeft = gameConfig.timeDurations[this.currentTimeIndex];
    safeStorage.set('currentTimeIndex', this.currentTimeIndex);

    return this.formatTime(this.timeLeft);
  }

  // === 状态访问 ===
  isGameOver() {
    return this.gameOver;
  }

  isGameRunning() {
    return this.isPlaying && !this.gameOver;
  }

  canSwitchSettings() {
    return this.gameOver || !this.isPlaying;
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  getCurrentRating() {
    return this.ratingSystem.getRating();
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs}s`;
  }

  cleanup() {
    this.stopTimer();
    this.statsManager.stopPlaying();
  }
}
