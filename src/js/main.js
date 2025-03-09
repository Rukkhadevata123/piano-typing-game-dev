import { Game } from '@js/Game/Game.js'; // 使用别名路径，与 vite.config.js 一致
import { safeStorage } from '@js/utils/safeStorage.js'; // 使用别名路径，与 vite.config.js 一致

/**
 * 处理CSS加载并避免无样式内容闪烁(FOUC)
 */
function handleCSSLoading() {
  // 先创建一个加载指示器，提供更好的用户体验
  const loadingIndicator = document.createElement('div');
  loadingIndicator.id = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:24px;margin-bottom:10px">加载中...</div>
      <div class="loading-spinner"></div>
    </div>
  `;

  // 设置基础样式，避免自身也有闪烁问题
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '0';
  loadingIndicator.style.left = '0';
  loadingIndicator.style.width = '100%';
  loadingIndicator.style.height = '100%';
  loadingIndicator.style.display = 'flex';
  loadingIndicator.style.alignItems = 'center';
  loadingIndicator.style.justifyContent = 'center';
  loadingIndicator.style.backgroundColor = '#1a1a1a';
  loadingIndicator.style.color = '#fff';
  loadingIndicator.style.zIndex = '9999';
  loadingIndicator.style.transition = 'opacity 0.5s ease';

  // 添加旋转动画
  const style = document.createElement('style');
  style.textContent = `
    .loading-spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto;
      border: 4px solid rgba(255, 255, 255, 0.2);
      border-top-color: var(--primary-color, #3498db);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(loadingIndicator);

  // 监听CSS加载完成
  const cssFiles = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  );
  let loadedCount = 0;

  // 处理已加载的CSS
  function handleCssLoaded() {
    loadedCount++;
    if (loadedCount >= cssFiles.length) {
      // 所有CSS已加载，添加标记类并淡出加载器
      document.documentElement.classList.add('css-loaded');
      loadingIndicator.style.opacity = '0';

      // 动画结束后移除加载指示器
      setTimeout(() => {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      }, 500); // 与过渡时间匹配
    }
  }

  // 监听所有CSS文件的加载
  if (cssFiles.length === 0) {
    // 没有CSS文件，直接标记为加载完成
    document.documentElement.classList.add('css-loaded');
    loadingIndicator.style.opacity = '0';
    setTimeout(() => loadingIndicator.remove(), 500);
  } else {
    cssFiles.forEach((css) => {
      // 检查CSS是否已加载
      if (css.sheet || css.loaded) {
        handleCssLoaded();
      } else {
        css.addEventListener('load', handleCssLoaded);
        css.addEventListener('error', handleCssLoaded); // 即使加载失败也继续
      }
    });

    // 超时处理，避免永远卡在加载界面
    setTimeout(() => {
      document.documentElement.classList.add('css-loaded');
      loadingIndicator.style.opacity = '0';
      setTimeout(() => {
        if (loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
      }, 500);
    }, 3000); // 3秒后无论如何都完成加载
  }
}

// 在DOM内容加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
  // 先处理CSS加载问题
  handleCSSLoading();

  try {
    // 仅在必要时清理存储
    const shouldResetStorage = safeStorage.get('needsReset', true);

    if (shouldResetStorage) {
      // 保存重要数据
      const savedHistory = safeStorage.get('gameHistory', []);
      const savedScores = safeStorage.get('highScores', []);
      const savedTheme = safeStorage.get('currentTheme', '0');
      const savedRating = safeStorage.get('playerRating', null); // 保存等级分

      // 清理存储
      localStorage.clear();

      // 恢复重要数据
      safeStorage.set('gameHistory', savedHistory);
      safeStorage.set('highScores', savedScores);
      safeStorage.set('currentTheme', savedTheme);
      if (savedRating) {
        safeStorage.set('playerRating', savedRating); // 恢复等级分
      }
      safeStorage.set('needsReset', false);
    }

    // 确保CSS加载完成后再初始化游戏
    const initGame = () => {
      // 如果CSS已加载完成，立即初始化游戏
      if (document.documentElement.classList.contains('css-loaded')) {
        const game = new Game();
        window.gameInstance = game;
        game.init();
      } else {
        // 等待CSS加载完成
        setTimeout(initGame, 100);
      }
    };

    // 开始检查CSS加载状态
    initGame();
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
