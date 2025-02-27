import { themes } from '@js/config/themeConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';
import { formatTime } from '@js/utils/timeFormat.js';

export class GameView {
  constructor(board) {
    console.log('[GameView] 初始化');
    this.board = board;
    this.elements = {};
    this.animationQueue = new Map(); // 存储动画状态
    this.renderPending = false; // 渲染节流标记

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.initializeElements();
    this.currentThemeIndex = parseInt(safeStorage.get('currentTheme', '0'));
    this.applyCurrentTheme();
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
      'final-score',
      'final-cps',
      'final-accuracy',
      'final-max-combo',
      'restart-button',
      'game-board',
    ];

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        this.elements[id.split('-').join('_')] = element;
      }
    });
  }

  renderBoard() {
    if (this.renderPending) return;
    this.renderPending = true;

    requestAnimationFrame(() => {
      const gameBoard = this.getElementById('game-board');
      if (!gameBoard) {
        this.renderPending = false;
        return;
      }

      const oldCells = this.getPreviousCellStates();
      const fragment = document.createDocumentFragment();

      this.board.getRenderData().forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        row.forEach((cell, colIndex) => {
          const cellElement = this.createCell(
            rowIndex,
            colIndex,
            cell,
            oldCells
          );
          rowDiv.appendChild(cellElement);
        });

        fragment.appendChild(rowDiv);
      });

      gameBoard.innerHTML = '';
      gameBoard.appendChild(fragment);
      this.renderPending = false;
    });
  }

  getPreviousCellStates() {
    const cells = new Map();
    const gameBoard = this.getElementById('game-board');
    if (!gameBoard) return cells;

    gameBoard.querySelectorAll('.cell').forEach((cell) => {
      cells.set(
        `${cell.dataset.row}-${cell.dataset.col}`,
        cell.classList.contains('filled')
      );
    });
    return cells;
  }

  createCell(row, col, cell, oldCells) {
    const cellDiv = document.createElement('div');
    const key = `${row}-${col}`;

    cellDiv.className = `cell ${cell.value ? 'filled' : ''}`;
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;

    if (cell.value) {
      if (!oldCells.get(key)) {
        this.addDropAnimation(cellDiv);
      }
      this.setCellColor(cellDiv, row + col);
    }

    return cellDiv;
  }

  addDropAnimation(cell) {
    // 如果已经有动画在进行,先清除
    if (this.animationQueue.has(cell)) {
      cell.classList.remove('dropping');
      cancelAnimationFrame(this.animationQueue.get(cell));
    }

    // 添加新动画
    const animationFrame = requestAnimationFrame(() => {
      void cell.offsetWidth; // 强制重排
      cell.classList.add('dropping');

      cell.addEventListener(
        'animationend',
        () => {
          cell.classList.remove('dropping');
          this.animationQueue.delete(cell);
        },
        { once: true }
      );
    });

    this.animationQueue.set(cell, animationFrame);
  }

  setCellColor(cell, index) {
    const theme = themes[this.currentThemeIndex];
    const color = theme.colors
      ? theme.colors[index % theme.colors.length]
      : theme.color;
    cell.style.setProperty('--cell-color', color);
  }

  getElementById(id) {
    return this.elements[id.split('-').join('_')];
  }

  switchTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % themes.length;
    safeStorage.set('currentTheme', this.currentThemeIndex);
    this.applyCurrentTheme();
    this.renderBoard();
    return themes[this.currentThemeIndex].name;
  }

  applyCurrentTheme() {
    const theme = themes[this.currentThemeIndex];
    document.documentElement.style.setProperty(
      '--primary-color',
      theme.color || theme.colors[0]
    );
    document.documentElement.style.setProperty(
      '--secondary-color',
      theme.secondary
    );
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

  updateTimer(timeLeft) {
    const element = this.getElementById('timer');
    if (element) {
      const formattedTime =
        typeof timeLeft === 'number' ? formatTime(timeLeft) : timeLeft;
      element.textContent = `剩余时间: ${formattedTime}`;
    }
  }

  updateScore(score) {
    const element = this.getElementById('score');
    if (element) {
      element.textContent = `分数: ${score}`;
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

  showFinalStats(stats, finalScore) {
    const gameOver = this.getElementById('game-over');
    if (!gameOver) return;

    gameOver.style.display = 'block';

    const updates = {
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
}
