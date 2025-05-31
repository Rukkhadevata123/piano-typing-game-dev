export class TouchHandler {
  constructor(gameController) {
    this.gameController = gameController;
    this.handleClick = this.handleClick.bind(this);
  }

  init() {
    const gameBoard = document.getElementById('game-board');
    if (gameBoard) {
      gameBoard.addEventListener('click', this.handleClick);
      gameBoard.addEventListener('touchstart', this.handleClick, {
        passive: false,
      });
    }
  }

  handleClick(event) {
    event.preventDefault();
    const cell = event.target;

    if (
      cell.classList.contains('cell') &&
      !this.gameController.engine.isGameOver
    ) {
      const column = parseInt(cell.dataset.col);

      // 更新最后操作时间（专注模式）
      if (this.gameController.engine.statsManager.focusMode) {
        this.gameController.engine.statsManager.updateLastActionTime();
      }

      this.gameController.handleColumnInput(column);
    }
  }

  cleanup() {
    const gameBoard = document.getElementById('game-board');
    if (gameBoard) {
      gameBoard.removeEventListener('click', this.handleClick);
      gameBoard.removeEventListener('touchstart', this.handleClick);
    }
  }
}
