import { formatTime } from '@js/utils/timeFormat.js';
import { safeStorage } from '@js/utils/safeStorage.js';

/**
 * UI管理器 - 负责更新和管理界面元素
 */
export class UIManager {
  constructor() {
    this.ratingSystem = null;
    this.history = safeStorage.get('gameHistory', []);
    this.restartHandler = null;
  }

  // === 设置依赖 ===
  setRatingSystem(ratingSystem) {
    this.ratingSystem = ratingSystem;
  }

  // === 基础UI更新（简化的核心方法）===
  updateTimer(timeLeft) {
    this._updateElement(
      'timer',
      `剩余时间: ${typeof timeLeft === 'number' ? formatTime(timeLeft) : timeLeft}`
    );
  }

  updateStats(stats) {
    this._updateElement('accuracy', `准确率: ${stats.accuracy}%`);
    this._updateElement('cps', `CPS: ${stats.cps}`);
    this._updateElement('combo', `连击: ${stats.currentCombo}`);
  }

  updateMode(modeText) {
    this._updateElement('mode', `模式: ${modeText}`);
  }

  updateScore(score, details) {
    this._updateElement('score', `分数: ${score}`);

    if (details?.multipliers) {
      this._updateMultiplier(details.multipliers.total);
    }
  }

  updateRating(ratingData) {
    // 更新等级分显示
    const ratingEl = this._getElement('player-rating');
    if (ratingEl) {
      ratingEl.innerHTML = `等级分: ${ratingData.rating.toFixed(1)} <button id="rating-details-button" title="查看等级分详情">ⓘ</button>`;

      // 绑定按钮点击事件
      const btn = ratingEl.querySelector('#rating-details-button');
      if (btn) {
        btn.onclick = () => this.showRatingDetails();
      }
    }

    // 更新等级显示
    const levelEl = this._getElement('rating-level');
    if (levelEl) {
      levelEl.innerHTML = `<span style="color:${ratingData.level.color}">${ratingData.level.name}</span>`;
      this._addLevelTooltip(levelEl);
    }
  }

  // === 通知显示方法 ===

  /**
   * 显示专注模式切换通知
   * @param {boolean} isEnabled - 专注模式是否开启
   */
  showFocusModeNotification(isEnabled) {
    const statusClass = isEnabled ? 'focus-enabled' : 'focus-disabled';
    this._showSystemNotification(
      `专注模式: ${isEnabled ? '开启' : '关闭'}`,
      `focus-mode-notification ${statusClass}`, // 添加状态类名
      isEnabled ? '🎯' : '🎮'
    );
  }
  // === 游戏结束界面 ===
  showFinalStats(stats, finalScore, duration, ratingResult = null) {
    const gameOver = this._getElement('game-over');
    if (!gameOver) return;

    // 更新统计数据
    this._updateElement(
      'final-duration',
      duration ? formatTime(duration) : '0s'
    );
    this._updateElement('final-score', finalScore);
    this._updateElement('final-cps', stats.cps.toFixed(2));
    this._updateElement('final-accuracy', `${stats.accuracy.toFixed(2)}%`);
    this._updateElement('final-max-combo', stats.maxCombo);

    // 处理等级分显示
    this._updateRatingResult(ratingResult);

    // 延迟显示游戏结束界面，让段位动画先播放完成
    setTimeout(() => {
      gameOver.style.display = 'block';
      requestAnimationFrame(() => gameOver.classList.add('show'));
    }, 1000); // 延迟2秒，让段位动画有足够时间显示
  }

  // === 动画和特效 ===
  showLevelChangeAnimation(oldLevel, newLevel, isLevelUp = true) {
    if (!oldLevel || !newLevel || oldLevel.name === newLevel.name) return;

    // 先隐藏可能存在的游戏结束界面
    const gameOver = this._getElement('game-over');
    if (gameOver && gameOver.classList.contains('show')) {
      gameOver.classList.remove('show');
      setTimeout(() => (gameOver.style.display = 'none'), 300);
    }

    const container = document.createElement('div');
    container.className = `level-change-animation ${isLevelUp ? '' : 'level-down'}`;

    container.innerHTML = `
      <div class="level-change-content">
        <div class="level-change-title">${isLevelUp ? '🎉 段位晋升' : '📉 段位下降'}</div>
        <div class="level-change-from" style="color:${oldLevel.color}">${oldLevel.name}</div>
        <div class="level-change-arrow">${isLevelUp ? '⟹' : '⟾'}</div>
        <div class="level-change-to" style="color:${newLevel.color}">${newLevel.name}</div>
        ${!isLevelUp ? '<div class="level-down-message">继续努力，相信你能重回巅峰！</div>' : '<div class="level-up-message">恭喜你的技术得到认可！</div>'}
      </div>
    `;

    document.body.appendChild(container);
    setTimeout(() => container.classList.add('show'), 100);
    setTimeout(() => this._removeElement(container), 4000);
  }

  hideGameOver() {
    const gameOver = this._getElement('game-over');
    if (!gameOver) return;

    gameOver.classList.remove('show');
    setTimeout(() => (gameOver.style.display = 'none'), 300);
  }

  // === 事件绑定 ===
  bindRestartButton(handler) {
    const button = this._getElement('restart-button');
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

  unbindRestartButton() {
    const button = this._getElement('restart-button');
    if (button && this.restartHandler) {
      button.removeEventListener('click', this.restartHandler);
      this.restartHandler = null;
    }
  }

  // === 历史记录 ===
  updateHistory(duration, mode, stats, score) {
    const entry = { duration, mode, stats, score, timestamp: Date.now() };

    this.history.push(entry);
    if (this.history.length > 1) this.history.shift(); // 只保留最新的一条

    safeStorage.set('gameHistory', this.history);
    this._updateHistoryUI(entry);
  }

  // === 工具方法 ===
  getElementById(id) {
    return this._getElement(id);
  }

  markGameAsLoaded() {
    const container = this._getElement('game-container');
    if (container) container.classList.add('loaded');
  }

  // === 私有方法 ===
  _getElement(id) {
    return document.getElementById(id.replace(/_/g, '-'));
  }

  _updateElement(id, content) {
    const el = this._getElement(id);
    if (el) el.textContent = content;
  }

  /**
   * 显示系统通知的统一方法
   * @param {string} message - 通知消息
   * @param {string} className - CSS类名
   * @param {string} icon - 图标（可选）
   */
  _showSystemNotification(message, className, icon = '') {
    // 获取或创建通知容器
    let container = document.getElementById('system-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'system-notification-container';
      container.className = 'system-notification-container';
      document.body.appendChild(container);
    }

    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `system-notification ${className}`;

    // 设置通知内容
    notification.textContent = icon ? `${icon} ${message}` : message;

    // 添加到容器
    container.appendChild(notification);

    // 显示动画
    requestAnimationFrame(() => {
      notification.classList.add('show');

      // 自动移除
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300); // 等待动画完成
      }, 1500); // 显示1.5秒
    });
  }

  _updateMultiplier(multiplierValue) {
    let multiplierEl = document.getElementById('multiplier');

    if (!multiplierEl) {
      const scoreEl = this._getElement('score');
      if (!scoreEl) return;

      multiplierEl = document.createElement('div');
      multiplierEl.id = 'multiplier';
      multiplierEl.className = 'multiplier';
      scoreEl.parentNode.insertBefore(multiplierEl, scoreEl.nextSibling);
    }

    const oldValue = parseFloat(multiplierEl.dataset.value || '1.0');
    const newValue = parseFloat(multiplierValue);

    multiplierEl.textContent = `倍率: ${multiplierValue}×`;
    multiplierEl.dataset.value = newValue.toString();

    // 使用新的动画系统
    multiplierEl.className = `multiplier ${newValue >= 4 ? 'excellent' : newValue >= 2.5 ? 'good' : 'normal'}`;

    // 添加脉冲动画
    if (Math.abs(newValue - oldValue) > 0.1) {
      const animationClass = newValue > oldValue ? 'pulse-up' : 'pulse-down';
      multiplierEl.classList.add(animationClass);

      // 动画结束后清理类名
      const handleAnimationEnd = (event) => {
        if (
          event.animationName ===
          (newValue > oldValue ? 'pulseUp' : 'pulseDown')
        ) {
          multiplierEl.classList.remove(animationClass);
        }
      };
      multiplierEl.addEventListener('animationend', handleAnimationEnd, {
        once: true,
      });
    }
  }

  _updateRatingResult(ratingResult) {
    const container = document.getElementById('rating-container');
    if (!container) return;

    if (ratingResult?.changed) {
      this._updateElement('game-rating', ratingResult.gameRating.toFixed(1));
      this._updateElement(
        'current-rating',
        ratingResult.currentRating.toFixed(1)
      );

      const newBestContainer = document.getElementById('new-best-container');
      if (newBestContainer) {
        newBestContainer.style.display = ratingResult.isNewBest
          ? 'block'
          : 'none';
      }

      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  _addLevelTooltip(levelEl) {
    // 移除可能存在的旧tooltip
    const existingTooltip = document.querySelector('.level-tooltip-global');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // 创建全局tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'level-tooltip-global';
    tooltip.innerHTML = `
      <div class="level-tooltip-title">🏆 段位排序 (由低到高)</div>
      ${this._generateLevelTooltipItems()}
    `;

    // 直接添加到body
    document.body.appendChild(tooltip);

    // 鼠标进入显示
    levelEl.addEventListener('mouseenter', (e) => {
      this._positionTooltip(tooltip, e.currentTarget);
      tooltip.classList.add('show');
    });

    // 鼠标离开隐藏
    levelEl.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
      if (document.body.contains(tooltip)) {
        document.body.removeChild(tooltip);
      }
    });
  }

  /**
   * 动态定位tooltip - 简化版本，确保在视窗内
   */
  _positionTooltip(tooltip, triggerElement) {
    const rect = triggerElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 默认位置：触发元素右下方
    let left = rect.right + 12;
    let top = rect.top;

    // 如果右侧空间不够，放到左侧
    if (left + 320 > viewportWidth - 16) {
      left = rect.left - 320 - 12;
    }

    // 如果左侧也不够，居中显示
    if (left < 16) {
      left = (viewportWidth - 320) / 2;
    }

    // 确保不超出底部
    if (top + 400 > viewportHeight - 16) {
      top = viewportHeight - 400 - 16;
    }

    // 确保不超出顶部
    if (top < 16) {
      top = 16;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  _generateLevelTooltipItems() {
    const levels = [
      { name: '青铜等级', color: '#cd7f32', range: '0-5000', icon: '🥉' },
      { name: '白银等级', color: '#c0c0c0', range: '5000-6250', icon: '🥈' },
      { name: '黄金等级', color: '#ffd700', range: '6250-7500', icon: '🥇' },
      { name: '蓝宝石等级', color: '#0073cf', range: '7500-8750', icon: '💎' },
      { name: '红宝石等级', color: '#e0115f', range: '8750-10000', icon: '♦️' },
      {
        name: '绿宝石等级',
        color: '#50c878',
        range: '10000-11250',
        icon: '💚',
      },
      {
        name: '紫水晶等级',
        color: '#9966cc',
        range: '11250-12500',
        icon: '🔮',
      },
      { name: '珍珠等级', color: '#fdeef4', range: '12500-13750', icon: '🤍' },
      {
        name: '黑曜石等级',
        color: '#413839',
        range: '13750-15000',
        icon: '⚫',
      },
      { name: '钻石等级', color: '#b9f2ff', range: '15000+', icon: '💎' },
    ];

    return levels
      .map(
        (level) =>
          `<div class="level-tooltip-item">
        <span style="color:${level.color}">${level.icon}</span>
        <span style="color:${level.color}">${level.name}</span>
        <span>${level.range}</span>
      </div>`
      )
      .join('');
  }

  _updateHistoryUI(entry) {
    const container = document.getElementById('history-stats');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'history-entry';

    // 优化版本 - 更好的可读性和布局
    div.innerHTML = `
      <div class="history-header">
        <span>时长: ${formatTime(entry.duration)}</span>
        <span>模式: ${entry.mode === 'row' ? '整行' : '单块'}</span>
      </div>
      <div>得分</div>
      <div>${entry.score}</div>
      <div>CPS</div>
      <div>${entry.stats.cps.toFixed(1)}</div>
      <div>准确率</div>
      <div>${entry.stats.accuracy.toFixed(1)}%</div>
      <div>最大连击</div>
      <div>${entry.stats.maxCombo}</div>
    `;

    // 保留最近的一条记录，如果有多条则只显示最新的
    container.innerHTML = '';
    container.appendChild(div);
  }

  _removeElement(element) {
    element.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(element)) {
        document.body.removeChild(element);
      }
    }, 1000);
  }

  // === 等级分详情弹窗（简化版）===
  showRatingDetails() {
    if (!this.ratingSystem || document.querySelector('.modal-overlay')) return;

    const records = this.ratingSystem.getBestRecords();
    const ratingData = this.ratingSystem.getRating();

    const overlay = this._createModal();
    const modal = this._createRatingModal(ratingData, records);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));
  }

  _createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const closeModal = () => {
      overlay.classList.add('closing');
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    return overlay;
  }

  _createRatingModal(ratingData, records) {
    const modal = document.createElement('div');
    modal.className = 'rating-details-modal';
    modal.onclick = (e) => e.stopPropagation();

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2>玩家等级分详情</h2>
        <button id="close-modal-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>
      
      <p class="current-rating">
        当前等级分: <span>${ratingData.rating.toFixed(1)}</span> 
        <span class="level-badge" style="color:${ratingData.level.color}">${ratingData.level.name}</span>
      </p>
      
      <p>总游戏场次: ${ratingData.games}</p>
      
      ${this._createRecordsTable(records)}
      
      <div class="rating-button-container">
        <button class="modal-button export-button" id="export-data-btn">
          <span>📊</span> <span>导出记录</span>
        </button>
        <button class="modal-button close-button" id="close-modal-btn-2">
          <span>✖</span> <span>关闭</span>
        </button>
      </div>
    `;

    // 绑定事件监听器
    const closeBtn = modal.querySelector('#close-modal-btn');
    const closeBtn2 = modal.querySelector('#close-modal-btn-2');
    const exportBtn = modal.querySelector('#export-data-btn');

    if (closeBtn) {
      closeBtn.onclick = () => {
        const overlay = modal.closest('.modal-overlay');
        if (overlay) overlay.click();
      };
    }

    if (closeBtn2) {
      closeBtn2.onclick = () => {
        const overlay = modal.closest('.modal-overlay');
        if (overlay) overlay.click();
      };
    }

    if (exportBtn) {
      exportBtn.onclick = () => this._exportRatingData(records);
    }

    return modal;
  }

  _createRecordsTable(records) {
    if (!records || records.length === 0) {
      return '<p>暂无游戏记录</p>';
    }

    const rows = records
      .map((record, index) => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        const focusTag = record.focusMode
          ? '<span class="focus-mode-tag">专注</span>'
          : '';

        return `
        <tr ${record.focusMode ? 'class="focus-mode-record"' : ''}>
          <td>${index + 1}</td>
          <td><strong>${record.rating.toFixed(1)}</strong>${focusTag}</td>
          <td>${record.score}</td>
          <td>${record.accuracy.toFixed(2)}%</td>
          <td>${record.cps.toFixed(2)}</td>
          <td>${record.maxCombo || '-'}</td>
          <td>${record.duration}s</td>
          <td>${dateStr}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table class="rating-records-table">
        <thead>
          <tr>
            <th>排名</th><th>等级分</th><th>分数</th><th>准确率</th>
            <th>CPS</th><th>最大连击</th><th>时长</th><th>日期</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  _exportRatingData(records) {
    const headers = [
      '排名',
      '等级分',
      '分数',
      '准确率',
      'CPS',
      '最大连击',
      '时长',
      '日期',
      '专注模式',
    ];
    let csvContent = headers.join(',') + '\n';

    records.forEach((record, index) => {
      const date = new Date(record.date);
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

      const row = [
        index + 1,
        record.rating.toFixed(1),
        record.score,
        record.accuracy.toFixed(2) + '%',
        record.cps.toFixed(2),
        record.maxCombo || '-',
        record.duration + 's',
        dateStr,
        record.focusMode ? '是' : '否',
      ];

      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `piano-game-ratings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
