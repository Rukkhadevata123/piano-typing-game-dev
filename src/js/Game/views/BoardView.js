import { themes } from '@js/config/themeConfig.js';

export class BoardView {
  constructor() {
    this.currentThemeIndex = 0;
    this.renderPending = false;
  }

  setThemeIndex(index) {
    this.currentThemeIndex = index;
  }

  renderBoard(gameBoardElement, boardData) {
    if (this.renderPending || !gameBoardElement || !boardData) return;
    this.renderPending = true;

    requestAnimationFrame(() => {
      const oldCells = this._getPreviousCellStates(gameBoardElement);
      const fragment = document.createDocumentFragment();

      boardData.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        row.forEach((cell, colIndex) => {
          const cellElement = this._createCell(
            rowIndex,
            colIndex,
            cell,
            oldCells
          );
          rowDiv.appendChild(cellElement);
        });

        fragment.appendChild(rowDiv);
      });

      gameBoardElement.innerHTML = '';
      gameBoardElement.appendChild(fragment);
      this.renderPending = false;
    });
  }

  // 🔧 简化：移除复杂的动画队列，使用简单的CSS动画
  _createCell(row, col, cell, oldCells) {
    const cellDiv = document.createElement('div');
    const key = `${row}-${col}`;

    cellDiv.className = `cell ${cell.value ? 'filled' : ''}`;
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;

    if (cell.value) {
      if (!oldCells.get(key)) {
        cellDiv.classList.add('dropping');
      }
      this._setCellColor(cellDiv, row + col);
    }

    return cellDiv;
  }

  _getPreviousCellStates(gameBoard) {
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

  _setCellColor(cell, index) {
    const theme = themes[this.currentThemeIndex];
    const color = theme.colors
      ? theme.colors[index % theme.colors.length]
      : theme.color;
    cell.style.setProperty('--cell-color', color);
  }
}
