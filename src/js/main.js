import { Game } from '@js/Game/Game.js'; // 使用别名路径，与 vite.config.js 一致
import { safeStorage } from '@js/utils/safeStorage.js'; // 使用别名路径，与 vite.config.js 一致

window.addEventListener('DOMContentLoaded', () => {
  try {
    // 仅在必要时清理存储
    const shouldResetStorage = safeStorage.get('needsReset', true);

    if (shouldResetStorage) {
      // 保存重要数据
      const savedHistory = safeStorage.get('gameHistory', []);
      const savedScores = safeStorage.get('highScores', []);
      const savedTheme = safeStorage.get('currentTheme', '0');

      // 清理存储
      localStorage.clear();

      // 恢复重要数据
      safeStorage.set('gameHistory', savedHistory);
      safeStorage.set('highScores', savedScores);
      safeStorage.set('currentTheme', savedTheme);
      safeStorage.set('needsReset', false);
    }

    const game = new Game();
    window.gameInstance = game;
    game.init();
  } catch (error) {
    console.error('游戏初始化失败:', error);
    showErrorMessage('游戏加载失败，请刷新页面重试。', error.message);
  }
});

// 提取错误显示逻辑为独立函数
function showErrorMessage(title, detail) {
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.innerHTML = `
        <div class="error-message">
        ${title}
        <br>
        错误信息: ${detail}
        </div>
        `;
  }
}
