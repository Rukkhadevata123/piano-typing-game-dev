import { formatTime } from '@js/utils/timeFormat.js';

/**
 * UI管理器 - 负责更新和管理界面元素
 */
export class UIManager {
  constructor() {
    this.elements = {};
    this.initializeElements();
  }

  initializeElements() {
    const ids = [
      'timer',
      'score',
      'accuracy',
      'cps',
      'combo',
      'mode',
      'game-over',
      'game-container',
      'final-duration',
      'final-score',
      'final-cps',
      'final-accuracy',
      'final-max-combo',
      'restart-button',
      'game-board',
    ];

    this.elements = ids.reduce((acc, id) => {
      const element = document.getElementById(id);
      if (element) {
        acc[id.replace(/-/g, '_')] = element;
      }
      return acc;
    }, {});
  }

  getElementById(id) {
    const normalizedId = id.includes('_') ? id : id.replace(/-/g, '_');
    return this.elements[normalizedId];
  }

  updateTimer(timeLeft) {
    const element = this.getElementById('timer');
    if (element) {
      const formattedTime =
        typeof timeLeft === 'number' ? formatTime(timeLeft) : timeLeft;
      element.textContent = `剩余时间: ${formattedTime}`;
    }
  }

  updateStats(stats) {
    const elements = [
      ['accuracy', `准确率: ${stats.accuracy}%`],
      ['cps', `CPS: ${stats.cps}`],
      ['combo', `连击: ${stats.currentCombo}`],
    ];

    elements.forEach(([id, text]) => {
      const element = this.getElementById(id);
      if (element) element.textContent = text;
    });
  }

  updateMode(modeText) {
    const element = this.getElementById('mode');
    if (element) {
      element.textContent = `模式: ${modeText}`;
    }
  }

  updateScore(score, details) {
    const element = this.getElementById('score');
    if (!element) return;

    // 基础分数显示
    element.textContent = `分数: ${score}`;

    // 倍率显示增强
    if (details && details.multipliers) {
      const multiplierElement = this.getOrCreateMultiplierElement();
      const multiplier = parseFloat(details.multipliers.total);

      // 保存旧倍率，用于动画效果
      const oldMultiplier = multiplierElement.dataset.value
        ? parseFloat(multiplierElement.dataset.value)
        : 1.0;

      // 更新文本和数据属性
      multiplierElement.textContent = `倍率: ${details.multipliers.total}×`;
      multiplierElement.dataset.value = multiplier;

      // 添加动画效果
      this.updateMultiplierVisual(multiplierElement, multiplier, oldMultiplier);
    }
  }

  getOrCreateMultiplierElement() {
    let multiplierElement = document.getElementById('multiplier');
    if (!multiplierElement) {
      const scoreElement = this.getElementById('score');
      multiplierElement = document.createElement('div');
      multiplierElement.id = 'multiplier';
      multiplierElement.className = 'multiplier';
      scoreElement.parentNode.insertBefore(
        multiplierElement,
        scoreElement.nextSibling
      );
    }
    return multiplierElement;
  }

  updateMultiplierVisual(element, newValue, oldValue) {
    // 根据倍率变化添加视觉反馈
    if (newValue > oldValue + 0.1) {
      element.classList.add('multiplier-up');
      setTimeout(() => element.classList.remove('multiplier-up'), 500);
    } else if (newValue < oldValue - 0.1) {
      element.classList.add('multiplier-down');
      setTimeout(() => element.classList.remove('multiplier-down'), 500);
    }

    // 根据倍率设置基础颜色
    if (newValue >= 4) {
      element.className = 'multiplier excellent';
    } else if (newValue >= 2.5) {
      element.className = 'multiplier good';
    } else {
      element.className = 'multiplier normal';
    }
  }

  showFinalStats(stats, finalScore, duration) {
    const gameOver = this.getElementById('game-over');
    if (!gameOver) return;

    gameOver.style.display = 'block';

    const updates = {
      final_duration: duration ? formatTime(duration) : '0s',
      final_score: finalScore,
      final_cps: stats.cps,
      final_accuracy: `${stats.accuracy}%`,
      final_max_combo: stats.maxCombo,
    };

    Object.entries(updates).forEach(([id, value]) => {
      const element = this.getElementById(id);
      if (element) element.textContent = value;
    });

    requestAnimationFrame(() => gameOver.classList.add('show'));
  }

  hideGameOver() {
    const gameOver = this.getElementById('game-over');
    if (!gameOver) return;

    gameOver.classList.remove('show');
    setTimeout(() => (gameOver.style.display = 'none'), 300);
  }

  markGameAsLoaded() {
    const container = this.getElementById('game-container');
    if (container) {
      container.classList.add('loaded');
    }
  }

  bindRestartButton(handler) {
    const button = this.getElementById('restart-button');
    if (!button) return;

    this.unbindRestartButton();
    this.restartHandler = (e) => {
      e.preventDefault();
      button.disabled = true;
      handler();
      setTimeout(() => (button.disabled = false), 1000);
    };
    button.addEventListener('click', this.restartHandler);
  }

  unbindRestartButton() {
    const button = this.getElementById('restart-button');
    if (button && this.restartHandler) {
      button.removeEventListener('click', this.restartHandler);
      this.restartHandler = null;
    }
  }
}
