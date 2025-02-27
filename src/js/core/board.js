/**
 * 游戏板管理模块
 */
import { gameConfig } from '@js/config/gameConfig.js';

export class Board {
  constructor(difficultyManager) {
    this.rows = gameConfig.rows;
    this.columns = gameConfig.columns;
    this.board = [];
    this.difficultyManager = difficultyManager;
  }

  initialize() {
    this.board = Array.from({ length: this.rows }, () =>
      this.generateRandomRow()
    );
  }

  generateRandomRow() {
    let row;
    do {
      row = Array.from({ length: this.columns }, () =>
        Math.random() < this.difficultyManager.getCurrentDifficulty() ? 1 : 0
      );
    } while (!this.isValidRow(row));
    return row;
  }

  isValidRow(row) {
    const { minBlocks, maxBlocks, maxConsecutive } = gameConfig.difficulty;
    const totalBlocks = row.filter((cell) => cell === 1).length;
    if (totalBlocks < minBlocks || totalBlocks > maxBlocks) return false;

    let consecutive = 0;
    for (let cell of row) {
      if (cell === 1) {
        consecutive++;
        if (consecutive > maxConsecutive) return false;
      } else {
        consecutive = 0;
      }
    }
    return true;
  }

  isRowEmpty(rowIndex) {
    return this.board[rowIndex].every((cell) => cell === 0);
  }

  dropAllRows() {
    this.board.pop();
    this.board.unshift(this.generateRandomRow());
    return this.board;
  }

  dropSingleColumn(column) {
    for (let row = this.rows - 2; row >= 0; row--) {
      this.board[row + 1][column] = this.board[row][column];
    }
    this.board[0][column] =
      Math.random() < this.difficultyManager.getCurrentDifficulty() ? 1 : 0;
    while (this.checkEmptyRow()) {
      this.dropAllRows();
    }
    return this.board;
  }

  checkEmptyRow() {
    return this.board.some((row) => row.every((cell) => cell === 0));
  }

  getCell(row, column) {
    return this.board[row][column];
  }

  setCell(row, column, value) {
    this.board[row][column] = value;
  }

  // getBoard() {
  //   return this.board;
  // }

  // 新增：为 GameView 提供渲染数据
  getRenderData() {
    return this.board.map((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        value: cell,
        row: rowIndex,
        col: colIndex,
      }))
    );
  }
}
