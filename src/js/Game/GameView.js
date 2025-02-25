import { themes } from '@js/config/themeConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class GameView {
  constructor(board) {
    this.board = board;
    this.elements = this.initializeElements();
    // 使用 safeStorage 替代 localStorage
    this.currentThemeIndex = parseInt(safeStorage.get('currentTheme', '0'));
    this.applyCurrentTheme();
  }

  initializeElements() {
    return {
      timer: document.getElementById('timer'),
      score: document.getElementById('score'),
      accuracy: document.getElementById('accuracy'),
      cps: document.getElementById('cps'),
      combo: document.getElementById('combo'),
      mode: document.getElementById('mode'),
      gameOver: document.getElementById('game-over'),
      gameContainer: document.getElementById('game-container'),
      finalScore: document.getElementById('final-score'),
      finalCps: document.getElementById('final-cps'),
      finalAccuracy: document.getElementById('final-accuracy'),
      finalMaxCombo: document.getElementById('final-max-combo'),
      restartButton: document.getElementById('restart-button'),
      gameBoard: document.getElementById('game-board'),
    };
  }

  renderBoard() {
    const gameBoard = this.elements.gameBoard;
    if (!gameBoard) return;
    gameBoard.innerHTML = '';
    const theme = themes[this.currentThemeIndex];
    let colorIndex = 0;

    this.board.getRenderData().forEach((row) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';

      row.forEach((cell) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = `cell ${cell.value === 1 ? 'filled' : ''}`;
        cellDiv.dataset.row = cell.row.toString();
        cellDiv.dataset.col = cell.col.toString();

        if (cell.value === 1) {
          if (theme.colors) {
            // 直接设置背景色，不使用伪元素
            cellDiv.style.setProperty(
              '--cell-color',
              theme.colors[colorIndex % theme.colors.length]
            );
            colorIndex++;
          } else {
            cellDiv.style.setProperty('--cell-color', theme.color);
          }
        }

        rowDiv.appendChild(cellDiv);
      });

      gameBoard.appendChild(rowDiv);
    });
  }

  switchTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % themes.length;
    // 使用 safeStorage
    safeStorage.set('currentTheme', this.currentThemeIndex.toString());
    this.applyCurrentTheme();
    this.renderBoard();
    return themes[this.currentThemeIndex].name;
  }

  applyCurrentTheme() {
    const theme = themes[this.currentThemeIndex];
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.color || theme.colors[0]);
    root.style.setProperty('--secondary-color', theme.secondary);
  }

  updateTimer(timeLeft) {
    this.safeUpdateElement(this.elements.timer, `剩余时间: ${timeLeft}秒`);
  }

  updateScore(score) {
    this.safeUpdateElement(this.elements.score, `分数: ${score}`);
  }

  updateStats(stats) {
    this.safeUpdateElement(
      this.elements.accuracy,
      `准确率: ${stats.accuracy}%`
    );
    this.safeUpdateElement(this.elements.cps, `CPS: ${stats.cps}`);
    this.safeUpdateElement(this.elements.combo, `连击: ${stats.currentCombo}`);
  }

  updateMode(modeText) {
    this.safeUpdateElement(this.elements.mode, `模式: ${modeText}`);
  }

  showFinalStats(stats, finalScore) {
    this.safeUpdateElement(this.elements.finalScore, finalScore);
    this.safeUpdateElement(this.elements.finalCps, stats.cps);
    this.safeUpdateElement(this.elements.finalAccuracy, `${stats.accuracy}%`);
    this.safeUpdateElement(this.elements.finalMaxCombo, stats.maxCombo);
    if (this.elements.gameOver) this.elements.gameOver.style.display = 'block';
  }

  hideGameOver() {
    if (this.elements.gameOver) this.elements.gameOver.style.display = 'none';
  }

  markGameAsLoaded() {
    if (this.elements.gameContainer)
      this.elements.gameContainer.classList.add('loaded');
  }

  safeUpdateElement(element, content) {
    if (element) element.textContent = content;
  }

  bindRestartButton(handler) {
    const button = this.elements.restartButton;
    if (!button) {
      console.warn('Restart button not found');
      return;
    }

    const wrappedHandler = (event) => {
      event.preventDefault();
      // 防止短时间内多次点击
      button.disabled = true;
      handler();
      setTimeout(() => {
        button.disabled = false;
      }, 1000);
    };

    button.removeEventListener('click', this._currentHandler);
    this._currentHandler = wrappedHandler;
    button.addEventListener('click', wrappedHandler);
  }

  unbindRestartButton(handler) {
    const button = this.elements.restartButton;
    if (button) {
      button.removeEventListener('click', handler);
    }
  }
}
