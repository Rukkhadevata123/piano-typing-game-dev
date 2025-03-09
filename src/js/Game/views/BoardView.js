import { themes } from '@js/config/themeConfig.js';

/**
 * 棋盘视图组件 - 负责渲染和动画
 */
export class BoardView {
  constructor(board) {
    this.board = board;
    this.animationQueue = new Map(); // 存储动画状态
    this.renderPending = false; // 渲染节流标记
    this.currentThemeIndex = 0;
  }

  setThemeIndex(index) {
    this.currentThemeIndex = index;
  }

  renderBoard(gameBoard) {
    if (this.renderPending) return;
    this.renderPending = true;

    requestAnimationFrame(() => {
      if (!gameBoard) {
        this.renderPending = false;
        return;
      }

      const oldCells = this.getPreviousCellStates(gameBoard);
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

  getPreviousCellStates(gameBoard) {
    const cells = new Map();
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

    // 添加新动画 - 确保与animations.css中的动画名称一致
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
}
