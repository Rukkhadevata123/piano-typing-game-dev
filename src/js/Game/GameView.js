import { themes } from '@js/config/themeConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';
import { formatTime } from '@js/utils/timeFormat.js';

export class GameView {
  constructor(board) {
    console.log('[GameView] Constructor 开始初始化');
    this.board = board;
    this.elements = {};
    // 将初始化延迟到 DOMContentLoaded 事件
    if (document.readyState === 'loading') {
      console.log('[GameView] DOM尚未加载，等待DOMContentLoaded事件');
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      console.log('[GameView] DOM已加载，立即初始化');
      this.init();
    }
    console.log('[GameView] Constructor 完成');
  }

  init() {
    console.log('[GameView] 初始化视图');
    this.initializeElements();
    this.currentThemeIndex = parseInt(safeStorage.get('currentTheme', '0'));
    console.log(`[GameView] 加载主题索引: ${this.currentThemeIndex}`);
    this.applyCurrentTheme();
    console.log('[GameView] 初始化视图完成');
  }

  initializeElements() {
    console.log('[GameView] 开始初始化DOM元素');
    const ids = [
      'timer',
      'score',
      'accuracy',
      'cps',
      'combo',
      'mode',
      'game-over',
      'game-container',
      'final-score',
      'final-cps',
      'final-accuracy',
      'final-max-combo',
      'restart-button',
      'game-board',
    ];

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`[GameView] 元素ID "${id}" 未找到`);
      } else {
        // 替换所有连字符为下划线（兼容写法）
        const elementId = id.split('-').join('_');
        this.elements[elementId] = element;
        console.log(`[GameView] 已找到元素 "${id}" -> "${elementId}"`);
      }
    });

    // 添加元素检查
    console.log('[GameView] 初始化元素完成:', Object.keys(this.elements));

    // 验证关键元素是否存在
    if (!this.elements.game_board) {
      console.error('[GameView] 关键元素game_board不存在');
      throw new Error(
        'Game board element not found. Make sure the HTML contains an element with id "game-board"'
      );
    }
  }

  renderBoard() {
    console.log('[GameView] 开始渲染游戏板');
    if (!this.elements.game_board) {
      console.error('[GameView] 游戏板元素不可用');
      return;
    }

    const oldCells = this.getPreviousCellStates();
    this.elements.game_board.innerHTML = '';

    this.board.getRenderData().forEach((row, rowIndex) => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';

      row.forEach((cell, colIndex) => {
        rowDiv.appendChild(this.createCell(rowIndex, colIndex, cell, oldCells));
      });
      this.elements.game_board.appendChild(rowDiv);
    });
    console.log('[GameView] 游戏板渲染完成');
  }

  getPreviousCellStates() {
    console.log('[GameView] 获取之前的单元格状态');
    const cells = new Map();
    if (!this.elements.game_board) return cells;

    this.elements.game_board.querySelectorAll('.cell').forEach((cell) => {
      const key = `${cell.dataset.row}-${cell.dataset.col}`;
      const value = cell.classList.contains('filled');
      cells.set(key, value);
    });
    console.log(`[GameView] 找到 ${cells.size} 个之前的单元格状态`);
    return cells;
  }

  createCell(row, col, cell, oldCells) {
    const cellDiv = document.createElement('div');
    const key = `${row}-${col}`;
    const wasFilled = oldCells.get(key);

    cellDiv.className = `cell ${cell.value ? 'filled' : ''}`;
    cellDiv.dataset.row = row;
    cellDiv.dataset.col = col;

    if (cell.value && !wasFilled) {
      console.log(`[GameView] 添加下落动画到单元格 ${key}`);
      this.addDropAnimation(cellDiv);
    }

    if (cell.value) {
      this.setCellColor(cellDiv, row + col);
    }

    return cellDiv;
  }

  addDropAnimation(cell) {
    console.log('[GameView] 添加下落动画');
    cell.classList.add('dropping');
    cell.addEventListener(
      'animationend',
      () => {
        console.log('[GameView] 下落动画结束，移除动画类');
        cell.classList.remove('dropping');
      },
      { once: true }
    );
  }

  setCellColor(cell, index) {
    console.log('[GameView] 设置单元格颜色');
    const theme = themes[this.currentThemeIndex];
    const color = theme.colors
      ? theme.colors[index % theme.colors.length]
      : theme.color;

    cell.style.setProperty('--cell-color', color);
  }

  switchTheme() {
    console.log('[GameView] 切换主题');
    const oldIndex = this.currentThemeIndex;
    this.currentThemeIndex = (this.currentThemeIndex + 1) % themes.length;
    console.log(
      `[GameView] 主题索引: ${oldIndex} -> ${this.currentThemeIndex}`
    );

    safeStorage.set('currentTheme', this.currentThemeIndex);
    this.applyCurrentTheme();
    this.renderBoard();

    const themeName = themes[this.currentThemeIndex].name;
    console.log(`[GameView] 已切换到主题: ${themeName}`);
    return themeName;
  }

  applyCurrentTheme() {
    console.log('[GameView] 应用当前主题');
    const root = document.documentElement;
    const theme = themes[this.currentThemeIndex];
    root.style.setProperty('--primary-color', theme.color || theme.colors[0]);
    root.style.setProperty('--secondary-color', theme.secondary);
    console.log(
      `[GameView] 应用主题颜色: primary=${theme.color || theme.colors[0]}, secondary=${theme.secondary}`
    );
  }

  bindRestartButton(handler) {
    console.log('[GameView] 绑定重启按钮');
    const button = this.elements.restart_button;
    if (!button) {
      console.warn('[GameView] 找不到重启按钮');
      return;
    }

    // 移除旧的事件监听器（如果存在）
    console.log('[GameView] 移除旧的重启按钮监听器');
    this.unbindRestartButton();

    // 保存处理函数引用以便后续移除
    this.restartHandler = (e) => {
      console.log('[GameView] 重启按钮被点击');
      e.preventDefault();
      e.stopPropagation();

      // 禁用按钮防止重复点击
      button.disabled = true;
      console.log('[GameView] 禁用重启按钮');

      // 执行重启逻辑
      console.log('[GameView] 调用重启处理函数');
      handler();

      // 1秒后重新启用按钮
      setTimeout(() => {
        console.log('[GameView] 重新启用重启按钮');
        button.disabled = false;
      }, 1000);
    };

    // 绑定新的事件监听器
    console.log('[GameView] 绑定新的重启按钮监听器');
    button.addEventListener('click', this.restartHandler);
  }

  unbindRestartButton() {
    console.log('[GameView] 解绑重启按钮');
    const button = this.elements.restart_button;
    if (button && this.restartHandler) {
      console.log('[GameView] 移除重启按钮事件监听器');
      button.removeEventListener('click', this.restartHandler);
      this.restartHandler = null;
    } else {
      console.log(
        '[GameView] 无需解绑重启按钮（按钮不存在或没有绑定处理函数）'
      );
    }
  }

  updateTimer(timeLeft) {
    console.log(`[GameView] 更新计时器: ${timeLeft}`);
    if (!this.elements.timer) {
      console.warn('[GameView] 计时器元素不存在');
      return;
    }

    try {
      const formattedTime =
        typeof timeLeft === 'number' ? formatTime(timeLeft) : timeLeft;
      console.log(`[GameView] 格式化时间: ${formattedTime}`);

      // 使用 requestAnimationFrame 确保视图更新同步
      requestAnimationFrame(() => {
        console.log(`[GameView] 更新计时器DOM: ${formattedTime}`);
        this.elements.timer.textContent = `剩余时间: ${formattedTime}`;
      });
    } catch (error) {
      console.error('[GameView] 更新计时器失败:', error);
    }
  }

  updateScore(score) {
    console.log(`[GameView] 更新分数: ${score}`);
    if (this.elements.score) {
      this.elements.score.textContent = `分数: ${score}`;
    } else {
      console.warn('[GameView] 分数元素不存在');
    }
  }

  updateStats(stats) {
    console.log('[GameView] 更新统计数据:', stats);
    if (this.elements.accuracy) {
      console.log(`[GameView] 更新准确率: ${stats.accuracy}%`);
      this.elements.accuracy.textContent = `准确率: ${stats.accuracy}%`;
    }
    if (this.elements.cps) {
      console.log(`[GameView] 更新CPS: ${stats.cps}`);
      this.elements.cps.textContent = `CPS: ${stats.cps}`;
    }
    if (this.elements.combo) {
      console.log(`[GameView] 更新连击: ${stats.currentCombo}`);
      this.elements.combo.textContent = `连击: ${stats.currentCombo}`;
    }
  }

  updateMode(modeText) {
    console.log(`[GameView] 更新游戏模式: ${modeText}`);
    if (this.elements.mode) {
      this.elements.mode.textContent = `模式: ${modeText}`;
    } else {
      console.warn('[GameView] 模式元素不存在');
    }
  }

  showFinalStats(stats, finalScore) {
    console.log('[GameView] 显示最终统计', { stats, finalScore });
    if (!this.elements.game_over) {
      console.warn('[GameView] 游戏结束弹窗元素不存在');
      return;
    }

    // 先确保弹窗可见
    console.log('[GameView] 显示游戏结束弹窗');
    this.elements.game_over.style.display = 'block';

    // 数据安全处理
    const safeStats = {
      cps: stats?.cps || 0,
      accuracy: stats?.accuracy || 0,
      maxCombo: stats?.maxCombo || 0,
    };

    console.log('[GameView] 准备更新最终统计元素', safeStats);

    // 直接访问正确转换后的元素 ID
    if (this.elements.final_score) {
      console.log(`[GameView] 更新最终分数: ${finalScore}`);
      this.elements.final_score.textContent = finalScore;
    } else {
      console.warn('[GameView] 最终分数元素不存在');
    }

    if (this.elements.final_cps) {
      console.log(`[GameView] 更新最终CPS: ${safeStats.cps}`);
      this.elements.final_cps.textContent = safeStats.cps;
    } else {
      console.warn('[GameView] 最终CPS元素不存在');
    }

    if (this.elements.final_accuracy) {
      console.log(`[GameView] 更新最终准确率: ${safeStats.accuracy}%`);
      this.elements.final_accuracy.textContent = `${safeStats.accuracy}%`;
    } else {
      console.warn('[GameView] 最终准确率元素不存在');
    }

    if (this.elements.final_max_combo) {
      console.log(`[GameView] 更新最终最大连击: ${safeStats.maxCombo}`);
      this.elements.final_max_combo.textContent = safeStats.maxCombo;
    } else {
      console.warn('[GameView] 最终最大连击元素不存在 (final_max_combo)');
      // 列出所有存在的元素名称以便调试
      console.log('[GameView] 可用元素:', Object.keys(this.elements));
    }

    // 添加动画类
    requestAnimationFrame(() => {
      console.log('[GameView] 添加游戏结束弹窗动画');
      this.elements.game_over.classList.add('show');
    });
  }

  hideGameOver() {
    console.log('[GameView] 隐藏游戏结束弹窗');
    if (!this.elements.game_over) {
      console.warn('[GameView] 游戏结束弹窗元素不存在');
      return;
    }

    // 移除显示类
    this.elements.game_over.classList.remove('show');
    console.log('[GameView] 移除游戏结束动画类');

    // 延迟隐藏元素，等待动画完成
    setTimeout(() => {
      console.log('[GameView] 完全隐藏游戏结束弹窗');
      this.elements.game_over.style.display = 'none';
    }, 300); // 与 CSS 过渡时间匹配
  }

  markGameAsLoaded() {
    console.log('[GameView] 标记游戏加载完成');
    if (this.elements.game_container) {
      this.elements.game_container.classList.add('loaded');
      console.log('[GameView] 游戏容器添加loaded类');
    } else {
      console.warn('[GameView] 游戏容器元素不存在');
    }
  }
}
