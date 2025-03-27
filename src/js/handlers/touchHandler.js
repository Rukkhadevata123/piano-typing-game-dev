export class TouchHandler {
  constructor(game) {
    this.game = game;
    this.handleClick = this.handleClick.bind(this);
  }

  init() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.addEventListener('click', this.handleClick);
    gameBoard.addEventListener('touchstart', this.handleClick, {
      passive: false,
    });
  }

  handleClick(event) {
    event.preventDefault();
    const cell = event.target;
    if (cell.classList.contains('cell') && !this.game.state.isOver()) {
      const column = parseInt(cell.dataset.col);

      // 更新最后操作时间
      if (this.game.statsManager.focusMode) {
        this.game.statsManager.updateLastActionTime();
      }

      this.game.handleColumnInput(column);
    }
  }

  cleanup() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.removeEventListener('click', this.handleClick);
    gameBoard.removeEventListener('touchstart', this.handleClick);
  }
}
