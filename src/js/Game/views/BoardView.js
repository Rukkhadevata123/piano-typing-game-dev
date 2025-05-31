import { themes } from '@js/config/themeConfig.js';

/**
 * 棋盘视图组件 - 负责渲染和动画（修复版）
 */
export class BoardView {
  constructor(board) {
    this.board = board;
    this.animationQueue = new Map();
    this.currentThemeIndex = 0;
    // 移除可能导致问题的缓存机制
  }

  setThemeIndex(index) {
    this.currentThemeIndex = index;
    this.updateAllCellColors();
  }

  renderBoard(gameBoard) {
    if (!gameBoard) return;

    // 移除复杂的增量渲染逻辑，确保每次都能正确渲染
    const currentData = this.board.getRenderData();

    // 使用同步渲染确保UI与游戏状态一致
    this.performRender(gameBoard, currentData);
  }

  performRender(gameBoard, boardData) {
    const fragment = document.createDocumentFragment();

    // 获取之前的单元格状态用于动画判断
    const oldCells = this.getPreviousCellStates(gameBoard);

    boardData.forEach((row, rowIndex) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';

      row.forEach((cell, colIndex) => {
        const cellElement = this.createCell(rowIndex, colIndex, cell, oldCells);
        rowDiv.appendChild(cellElement);
      });

      fragment.appendChild(rowDiv);
    });

    // 同步更新DOM - 确保立即反映游戏状态
    gameBoard.innerHTML = '';
    gameBoard.appendChild(fragment);
  }

  createCell(row, col, cell, oldCells) {
    const cellDiv = document.createElement('div');
    const key = `${row}-${col}`;

    cellDiv.className = 'cell';
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;

    if (cell.value) {
      cellDiv.classList.add('filled');

      // 只有新出现的方块才播放下落动画
      if (!oldCells.has(key)) {
        this.addDropAnimation(cellDiv);
      }

      this.setCellColor(cellDiv, row + col);
    }

    return cellDiv;
  }

  addDropAnimation(cell) {
    const key = `${cell.dataset.row}-${cell.dataset.col}`;

    // 清理之前的动画
    if (this.animationQueue.has(key)) {
      const cleanup = this.animationQueue.get(key);
      cleanup();
    }

    // 简化动画处理
    const cleanup = () => {
      cell.classList.remove('dropping');
      this.animationQueue.delete(key);
    };

    // 立即添加动画类
    cell.classList.add('dropping');

    // 设置动画结束清理
    const animationEndHandler = (event) => {
      if (event.target === cell && event.animationName === 'dropAnimation') {
        cleanup();
        cell.removeEventListener('animationend', animationEndHandler);
      }
    };

    cell.addEventListener('animationend', animationEndHandler, { once: true });

    // 存储清理函数
    this.animationQueue.set(key, cleanup);

    // 安全网：防止动画卡死
    setTimeout(cleanup, 500);
  }

  setCellColor(cell, index) {
    const theme = themes[this.currentThemeIndex];
    const color = theme.colors
      ? theme.colors[index % theme.colors.length]
      : theme.color;

    cell.style.setProperty('--cell-color', color);
  }

  updateAllCellColors() {
    // 简化颜色更新逻辑
    requestAnimationFrame(() => {
      const gameBoard = document.getElementById('game-board');
      if (gameBoard) {
        const filledCells = gameBoard.querySelectorAll('.cell.filled');
        filledCells.forEach((cell) => {
          const row = parseInt(cell.dataset.row);
          const col = parseInt(cell.dataset.col);
          this.setCellColor(cell, row + col);
        });
      }
    });
  }

  getPreviousCellStates(gameBoard) {
    const cells = new Set();
    if (!gameBoard) return cells;

    const filledCells = gameBoard.querySelectorAll('.cell.filled');
    filledCells.forEach((cell) => {
      const key = `${cell.dataset.row}-${cell.dataset.col}`;
      cells.add(key);
    });

    return cells;
  }
}
