import { keyMap } from '@js/config/keyMap.js';

export class KeyboardHandler {
  constructor(game) {
    this.game = game;
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  init() {
    document.addEventListener('keydown', this.handleKeyPress);
  }

  handleKeyPress(event) {
    const key = event.key.toUpperCase();
    if (key === 'T') {
      this.game.switchTheme();
      return;
    }
    if ((key === 'Q' || key === 'R') && this.game.state.canSwitchSettings()) {
      if (key === 'Q') this.game.switchGameTime();
      else this.game.switchGameMode();
      return;
    }
    if (this.game.state.isOver()) return;

    const column = keyMap[key];
    if (typeof column === 'number') {
      this.game.handleColumnInput(column);
    }
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }
}
