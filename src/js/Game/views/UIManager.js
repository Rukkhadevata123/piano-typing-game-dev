import { formatTime } from '@js/utils/timeFormat.js';

/**
 * UI管理器 - 负责更新和管理界面元素
 */
export class UIManager {
  constructor(game = null) {
    this.game = game;
    this.elements = {};
    this.initializeElements();
  }

  initializeElements() {
    const ids = [
      'timer',
      'score',
      'accuracy',
      'cps',
      'combo',
      'mode',
      'game-over',
      'game-container',
      'final-duration',
      'final-score',
      'final-cps',
      'final-accuracy',
      'final-max-combo',
      'restart-button',
      'game-board',
      'player-rating',
      'rating-level',
    ];

    this.elements = ids.reduce((acc, id) => {
      const element = document.getElementById(id);
      if (element) {
        acc[id.replace(/-/g, '_')] = element;
      }
      return acc;
    }, {});

    // 移除这里的按钮绑定，统一使用bindRatingDetailsButton方法
  }

  // 后续可以设置game引用
  setGame(game) {
    this.game = game;
  }

  getElementById(id) {
    const normalizedId = id.includes('_') ? id : id.replace(/-/g, '_');
    return this.elements[normalizedId];
  }

  updateTimer(timeLeft) {
    const element = this.getElementById('timer');
    if (element) {
      const formattedTime =
        typeof timeLeft === 'number' ? formatTime(timeLeft) : timeLeft;
      element.textContent = `剩余时间: ${formattedTime}`;
    }
  }

  updateStats(stats) {
    const elements = [
      ['accuracy', `准确率: ${stats.accuracy}%`],
      ['cps', `CPS: ${stats.cps}`],
      ['combo', `连击: ${stats.currentCombo}`],
    ];

    elements.forEach(([id, text]) => {
      const element = this.getElementById(id);
      if (element) element.textContent = text;
    });
  }

  updateMode(modeText) {
    const element = this.getElementById('mode');
    if (element) {
      element.textContent = `模式: ${modeText}`;
    }
  }

  updateScore(score, details) {
    const element = this.getElementById('score');
    if (!element) return;

    // 基础分数显示
    element.textContent = `分数: ${score}`;

    // 倍率显示增强
    if (details && details.multipliers) {
      const multiplierElement = this.getOrCreateMultiplierElement();
      const multiplier = parseFloat(details.multipliers.total);

      // 保存旧倍率，用于动画效果
      const oldMultiplier = multiplierElement.dataset.value
        ? parseFloat(multiplierElement.dataset.value)
        : 1.0;

      // 更新文本和数据属性
      multiplierElement.textContent = `倍率: ${details.multipliers.total}×`;
      multiplierElement.dataset.value = multiplier.toString();

      // 添加动画效果
      this.updateMultiplierVisual(multiplierElement, multiplier, oldMultiplier);
    }
  }

  updateRating(ratingData) {
    const ratingElement = this.getElementById('player-rating');
    const levelElement = this.getElementById('rating-level');

    if (ratingElement) {
      // 保留按钮而不是覆盖整个内容
      const detailsButton = document.getElementById('rating-details-button');

      // 先清除除按钮外的内容
      while (ratingElement.firstChild) {
        ratingElement.removeChild(ratingElement.firstChild);
      }

      // 添加新的文本内容
      const textNode = document.createTextNode(
        `等级分: ${ratingData.rating.toFixed(1)} `
      );
      ratingElement.appendChild(textNode);

      // 重新添加按钮（如果存在）或创建新按钮
      if (detailsButton) {
        ratingElement.appendChild(detailsButton);
      } else {
        const newButton = document.createElement('button');
        newButton.id = 'rating-details-button';
        newButton.title = '查看等级分详情';
        newButton.textContent = 'ⓘ';
        newButton.addEventListener('click', () =>
          this.showPlayerRatingDetails()
        );
        ratingElement.appendChild(newButton);
      }
    }

    if (levelElement) {
      // 清除之前的所有样式类和子元素
      levelElement.className = '';
      while (levelElement.firstChild) {
        levelElement.removeChild(levelElement.firstChild);
      }

      // 添加基础类
      levelElement.className = 'rating-level';

      // 设置文字
      levelElement.textContent = ratingData.level.name;
      levelElement.style.color = ratingData.level.color;

      // 创建并添加工具提示 - 更新为正确的段位分数区间
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.innerHTML = `
      <div class="level-tooltip-title">段位排序 (由低到高)</div>
      <div class="level-tooltip-item">
        <span style="color:#cd7f32">●</span>
        <span style="color:#cd7f32">青铜等级</span>
        <span>0-5000分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#c0c0c0">●</span>
        <span style="color:#c0c0c0">白银等级</span>
        <span>5000-6250分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#ffd700">●</span>
        <span style="color:#ffd700">黄金等级</span>
        <span>6250-7500分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#0073cf">●</span>
        <span style="color:#0073cf">蓝宝石等级</span>
        <span>7500-8750分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#e0115f">●</span>
        <span style="color:#e0115f">红宝石等级</span>
        <span>8750-10000分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#50c878">●</span>
        <span style="color:#50c878">绿宝石等级</span>
        <span>10000-11250分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#9966cc">●</span>
        <span style="color:#9966cc">紫水晶等级</span>
        <span>11250-12500分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#fdeef4">●</span>
        <span style="color:#fdeef4">珍珠等级</span>
        <span>12500-13750分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#413839">●</span>
        <span style="color:#413839">黑曜石等级</span>
        <span>13750-15000分</span>
      </div>
      <div class="level-tooltip-item">
        <span style="color:#b9f2ff">●</span>
        <span style="color:#b9f2ff">钻石等级</span>
        <span>15000分以上</span>
      </div>
    `;

      levelElement.appendChild(tooltip);

      // 特殊样式处理
      if (ratingData.level.name === '珍珠等级') {
        levelElement.classList.add('level-pearl');
      } else if (ratingData.level.name === '黑曜石等级') {
        levelElement.classList.add('level-obsidian');
      } else if (ratingData.level.name === '钻石等级') {
        levelElement.classList.add('level-diamond');
      }
    }
  }

  getOrCreateMultiplierElement() {
    let multiplierElement = document.getElementById('multiplier');
    if (!multiplierElement) {
      const scoreElement = this.getElementById('score');
      multiplierElement = document.createElement('div');
      multiplierElement.id = 'multiplier';
      multiplierElement.className = 'multiplier';
      scoreElement.parentNode.insertBefore(
        multiplierElement,
        scoreElement.nextSibling
      );
    }
    return multiplierElement;
  }

  updateMultiplierVisual(element, newValue, oldValue) {
    // 根据倍率变化添加视觉反馈
    if (newValue > oldValue + 0.1) {
      element.classList.add('multiplier-up');
      setTimeout(() => element.classList.remove('multiplier-up'), 500);
    } else if (newValue < oldValue - 0.1) {
      element.classList.add('multiplier-down');
      setTimeout(() => element.classList.remove('multiplier-down'), 500);
    }

    // 根据倍率设置基础颜色
    if (newValue >= 4) {
      element.className = 'multiplier excellent';
    } else if (newValue >= 2.5) {
      element.className = 'multiplier good';
    } else {
      element.className = 'multiplier normal';
    }
  }

  showFinalStats(stats, finalScore, duration, ratingResult = null) {
    const gameOver = this.getElementById('game-over');
    if (!gameOver) return;

    // 先设置内容再显示，避免闪烁
    gameOver.style.display = 'block';
    gameOver.style.visibility = 'hidden'; // 先隐藏，内容设置完再显示

    const updates = {
      final_duration: duration ? formatTime(duration) : '0s',
      final_score: finalScore,
      final_cps: stats.cps.toFixed(2),
      final_accuracy: `${stats.accuracy.toFixed(2)}%`,
      final_max_combo: stats.maxCombo,
    };

    Object.entries(updates).forEach(([id, value]) => {
      const element = this.getElementById(id);
      if (element) element.textContent = value;
    });

    // 添加等级分显示 - 使用预设容器
    const ratingContainer = document.getElementById('rating-container');
    if (ratingContainer && ratingResult && ratingResult.changed) {
      // 更新等级分内容
      const gameRatingElem = document.getElementById('game-rating');
      const currentRatingElem = document.getElementById('current-rating');
      const newBestContainer = document.getElementById('new-best-container');

      if (gameRatingElem) {
        gameRatingElem.textContent = ratingResult.gameRating.toFixed(1);
      }

      if (currentRatingElem) {
        currentRatingElem.textContent = ratingResult.currentRating.toFixed(1);
      }

      if (newBestContainer) {
        newBestContainer.style.display = ratingResult.isNewBest
          ? 'block'
          : 'none';
      }

      // 显示等级分容器
      ratingContainer.style.display = 'block';

      console.log('[UIManager] 显示等级分结果:', ratingResult);
    } else if (ratingContainer) {
      // 如果没有等级分结果，隐藏等级分容器
      ratingContainer.style.display = 'none';
      console.log('[UIManager] 没有等级分结果或ratingResult不存在');
    } else {
      console.error('[UIManager] 等级分容器不存在!');
    }

    requestAnimationFrame(() => {
      gameOver.style.visibility = 'visible';
      gameOver.classList.add('show');
    });
  }

  // 添加到UIManager类中
  showPlayerRatingDetails() {
    console.log('[UIManager] 尝试显示等级分详情');

    // 检查是否已有弹窗打开，避免重复创建
    if (document.querySelector('.modal-overlay')) {
      console.log('[UIManager] 弹窗已存在，避免重复创建');
      return;
    }

    const ratingSystem = this.game.ratingSystem;
    const records = ratingSystem.getBestRecords();

    // 使用文档片段减少DOM重排
    const fragment = document.createDocumentFragment();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // 创建ESC键监听器
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    // 创建关闭弹窗的函数（包含清理逻辑）
    const closeModal = () => {
      // 移除ESC键监听器，避免内存泄露
      document.removeEventListener('keydown', handleEsc);
      // 添加关闭动画类
      overlay.classList.add('closing');
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300); // 与CSS过渡时间匹配
    };

    // 添加点击背景关闭功能
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    const modal = document.createElement('div');
    modal.className = 'rating-details-modal';
    // 阻止事件冒泡，避免点击模态框时关闭
    modal.addEventListener('click', (e) => e.stopPropagation());

    // 添加标题和关闭按钮行
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.justifyContent = 'space-between';
    headerRow.style.alignItems = 'center';
    headerRow.style.marginBottom = '10px';

    const title = document.createElement('h2');
    title.textContent = '玩家等级分详情';
    headerRow.appendChild(title);

    // 添加右上角X关闭按钮
    const closeX = document.createElement('button');
    closeX.innerHTML = '&times;';
    closeX.style.background = 'none';
    closeX.style.border = 'none';
    closeX.style.fontSize = '24px';
    closeX.style.fontWeight = 'bold';
    closeX.style.cursor = 'pointer';
    closeX.style.color = '#666';
    closeX.style.padding = '0 8px';
    closeX.style.marginLeft = 'auto';
    closeX.onclick = () => closeModal();
    headerRow.appendChild(closeX);

    modal.appendChild(headerRow);

    // 添加当前等级分和段位
    const currentRating = document.createElement('p');
    currentRating.className = 'current-rating';
    const ratingData = ratingSystem.getRating();

    // 为等级添加特殊类
    let levelClassExtra = '';
    if (ratingData.level.name.includes('珍珠')) {
      levelClassExtra = ' level-pearl';
    } else if (ratingData.level.name.includes('黑曜石')) {
      levelClassExtra = ' level-obsidian';
    } else if (ratingData.level.name.includes('钻石')) {
      levelClassExtra = ' level-diamond';
    }

    currentRating.innerHTML = `当前等级分: <span>${ratingData.rating.toFixed(1)}</span> <span class="level-badge${levelClassExtra}" style="color:${ratingData.level.color}">${ratingData.level.name}</span>`;
    modal.appendChild(currentRating);

    // 添加游戏场次
    const gameCount = document.createElement('p');
    gameCount.textContent = `总游戏场次: ${ratingData.games}`;
    modal.appendChild(gameCount);

    // 添加最佳记录表格
    if (records && records.length > 0) {
      const table = document.createElement('table');
      table.className = 'rating-records-table';

      // 添加表头
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>排名</th>
          <th>等级分</th>
          <th>分数</th>
          <th>准确率</th>
          <th>CPS</th>
          <th>时长</th>
          <th>日期</th>
        </tr>
      `;
      table.appendChild(thead);

      // 添加表格内容
      const tbody = document.createElement('tbody');
      records.forEach((record, index) => {
        const row = document.createElement('tr');

        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        row.innerHTML = `
          <td>${index + 1}</td>
          <td><strong>${record.rating.toFixed(1)}</strong></td>
          <td>${record.score}</td>
          <td>${record.accuracy.toFixed(2)}%</td>
          <td>${record.cps.toFixed(2)}</td>
          <td>${record.duration}s</td>
          <td>${dateStr}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      modal.appendChild(table);
    } else {
      const noRecords = document.createElement('p');
      noRecords.textContent = '暂无游戏记录';
      modal.appendChild(noRecords);
    }

    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.className = 'close-button';
    closeButton.onclick = (e) => {
      e.stopPropagation(); // 防止事件冒泡
      closeModal();
    };
    modal.appendChild(closeButton);

    // 添加键盘ESC关闭支持
    document.addEventListener('keydown', handleEsc);

    // 先构建DOM结构，最后一次性添加到页面
    overlay.appendChild(modal);
    fragment.appendChild(overlay);
    document.body.appendChild(fragment);

    // 触发动画 - 使用动画帧确保DOM更新
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('show');
      });
    });
  }

  showLevelChangeAnimation(oldLevel, newLevel, isLevelUp = true) {
    if (!oldLevel || !newLevel || oldLevel.name === newLevel.name) return;

    console.log(
      `[UIManager] 段位${isLevelUp ? '晋升' : '下降'}: ${oldLevel.name} -> ${newLevel.name}`
    );

    const container = document.createElement('div');
    container.className = 'level-change-animation';

    // 根据是晋升还是下降添加不同的类名
    if (!isLevelUp) {
      container.classList.add('level-down');
    }

    container.innerHTML = `
      <div class="level-change-content">
        <div class="level-change-title">${isLevelUp ? '段位晋升' : '段位下降'}</div>
        <div class="level-change-from" style="color:${oldLevel.color}">${oldLevel.name}</div>
        <div class="level-change-arrow">${isLevelUp ? '⟹' : '⟾'}</div>
        <div class="level-change-to" style="color:${newLevel.color}">${newLevel.name}</div>
        ${!isLevelUp ? '<div class="level-down-message">继续努力，相信你能重回巅峰！</div>' : ''}
      </div>
    `;

    document.body.appendChild(container);

    // 添加进入动画
    setTimeout(() => container.classList.add('show'), 100);

    // 一段时间后移除
    setTimeout(() => {
      container.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }, 1000);
    }, 4000);
  }

  hideGameOver() {
    const gameOver = this.getElementById('game-over');
    if (!gameOver) return;

    gameOver.classList.remove('show');
    setTimeout(() => (gameOver.style.display = 'none'), 300);
  }

  markGameAsLoaded() {
    const container = this.getElementById('game-container');
    if (container) {
      container.classList.add('loaded');
    }
  }

  bindRestartButton(handler) {
    const button = this.getElementById('restart-button');
    if (!button) return;

    this.unbindRestartButton();
    this.restartHandler = (e) => {
      e.preventDefault();
      button.disabled = true;
      handler();
      setTimeout(() => (button.disabled = false), 1000);
    };
    button.addEventListener('click', this.restartHandler);
  }

  // 添加到UIManager类中
  bindRatingDetailsButton() {
    const ratingDetailsButton = document.getElementById(
      'rating-details-button'
    );
    if (!ratingDetailsButton) return;

    // 移除旧的监听器（使用克隆替换方式）
    const newButton = ratingDetailsButton.cloneNode(true);
    if (ratingDetailsButton.parentNode) {
      ratingDetailsButton.parentNode.replaceChild(
        newButton,
        ratingDetailsButton
      );
    }

    // 添加新的事件监听器
    newButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showPlayerRatingDetails();
    });

    return newButton; // 返回按钮实例，便于外部使用
  }

  unbindRestartButton() {
    const button = this.getElementById('restart-button');
    if (button && this.restartHandler) {
      button.removeEventListener('click', this.restartHandler);
      this.restartHandler = null;
    }
  }
}
