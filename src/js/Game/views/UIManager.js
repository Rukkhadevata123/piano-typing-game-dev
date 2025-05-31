import { formatTime } from '@js/utils/timeFormat.js';
import { safeStorage } from '@js/utils/safeStorage.js';

/**
 * UI管理器 - 负责更新和管理界面元素
 * 包含历史记录管理功能
 */
export class UIManager {
  constructor() {
    this.elements = this._initializeElements();
    this.restartHandler = null;
    this.ratingSystem = null;

    // 历史记录管理
    this.MAX_HISTORY_ENTRIES = 1;
    this.HISTORY_STORAGE_KEY = 'gameHistory';
    this.gameHistory = safeStorage.get(this.HISTORY_STORAGE_KEY, []);
  }

  // 设置等级分系统引用
  setRatingSystem(ratingSystem) {
    this.ratingSystem = ratingSystem;
  }

  // 基础UI更新方法
  updateTimer(timeLeft) {
    this._updateElement('timer', `剩余时间: ${formatTime(timeLeft)}`);
  }

  updateStats(stats) {
    this._updateElement('accuracy', `准确率: ${stats.accuracy}%`);
    this._updateElement('cps', `CPS: ${stats.cps}`);
    this._updateElement('combo', `连击: ${stats.currentCombo}`);
  }

  updateMode(modeText) {
    this._updateElement('mode', `模式: ${modeText}`);
  }

  // 🔧 简化：移除未使用的 details 参数
  updateScore(score) {
    this._updateElement('score', `分数: ${score}`);
  }

  updateRating(ratingData) {
    this._updateRatingDisplay(ratingData);
    this._updateLevelDisplay(ratingData.level);
  }

  // 简化的倍率更新 - 直接使用HTML中的元素
  updateMultiplier(multiplierValue) {
    const element = this._getElement('multiplier');
    if (!element) return;

    const value = parseFloat(multiplierValue);
    // 🔧 修改：统一保留两位小数
    element.textContent = `倍率: ${value.toFixed(2)}×`;
    element.style.display = 'block';

    // 🔧 优化：更丰富的视觉反馈
    element.className = 'multiplier';

    if (value >= 4) {
      element.classList.add('excellent');
    } else if (value >= 2.5) {
      element.classList.add('good');
    } else if (value >= 1.5) {
      element.classList.add('normal');
    } else {
      element.classList.add('low');
    }

    // 🔧 新增：倍率变化动画
    element.style.transform = 'scale(1.1)';
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 200);
  }

  // 历史记录管理
  updateGameHistory(duration, mode, stats, score) {
    const entry = {
      duration,
      mode,
      stats,
      score,
      timestamp: Date.now(),
    };

    console.log('[UIManager] 添加游戏历史记录');
    this.gameHistory.push(entry);

    // 保持最大记录数
    if (this.gameHistory.length > this.MAX_HISTORY_ENTRIES) {
      this.gameHistory.shift();
    }

    safeStorage.set(this.HISTORY_STORAGE_KEY, this.gameHistory);
    this._updateHistoryUI(entry);
  }

  // 游戏结束显示
  showFinalStats(stats, finalScore, duration, ratingResult = null) {
    const gameOver = this._getElement('game-over');
    if (!gameOver) return;

    gameOver.style.display = 'block';
    gameOver.style.visibility = 'hidden';

    this._updateFinalStats(stats, finalScore, duration);
    this._updateRatingResult(ratingResult);

    requestAnimationFrame(() => {
      gameOver.style.visibility = 'visible';
      gameOver.classList.add('show');
    });
  }

  hideGameOver() {
    const gameOver = this._getElement('game-over');
    if (!gameOver) return;

    gameOver.classList.remove('show');
    setTimeout(() => (gameOver.style.display = 'none'), 300);
  }

  markGameAsLoaded() {
    const container = this._getElement('game-container');
    if (container) {
      container.classList.add('loaded');
    }
  }

  // 按钮绑定
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

  // 动画效果
  showLevelChangeAnimation(oldLevel, newLevel, isLevelUp = true) {
    const container = document.createElement('div');
    container.className = `level-change-animation ${isLevelUp ? '' : 'level-down'}`;

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
    setTimeout(() => container.classList.add('show'), 100);
    setTimeout(() => {
      container.classList.remove('show');
      setTimeout(() => document.body.removeChild(container), 1000);
    }, 4000);
  }

  // 私有方法
  _initializeElements() {
    // 🔧 更新：添加新的预定义元素
    const ids = [
      'timer',
      'score',
      'accuracy',
      'cps',
      'combo',
      'mode',
      'multiplier',
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
      'notification-container',
      'combo-milestone-container',
    ];

    return ids.reduce((acc, id) => {
      const element = document.getElementById(id);
      if (element) {
        acc[id.replace(/-/g, '_')] = element;
      }
      return acc;
    }, {});
  }

  _getElement(id) {
    const normalizedId = id.includes('_') ? id : id.replace(/-/g, '_');
    return this.elements[normalizedId];
  }

  _updateElement(id, content) {
    const element = this._getElement(id);
    if (element) {
      element.textContent = content;
    }
  }

  _updateHistoryUI(entry) {
    const container = document.getElementById('history-stats');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'history-entry';
    div.innerHTML = `
      <div class="history-header">
        <span>时长: ${formatTime(entry.duration)}</span>
        <span>模式: ${entry.mode === 'row' ? '整行' : '单块'}</span>
      </div>
      <div>得分: ${entry.score}</div>
      <div>CPS: ${entry.stats.cps}</div>
      <div>准确率: ${entry.stats.accuracy}%</div>
      <div>最大连击: ${entry.stats.maxCombo}</div>
    `;

    // 维护最大显示数量
    while (container.children.length >= this.MAX_HISTORY_ENTRIES) {
      container.removeChild(container.firstChild);
    }

    container.appendChild(div);
  }

  _updateRatingDisplay(ratingData) {
    const ratingElement = this._getElement('player-rating');
    if (!ratingElement) return;

    // 清除内容并重建
    ratingElement.innerHTML = `
      等级分: ${ratingData.rating.toFixed(1)} 
      <button id="rating-details-button" title="查看等级分详情">ⓘ</button>
    `;

    // 重新绑定按钮事件
    this._bindRatingDetailsButton();
  }

  _updateLevelDisplay(level) {
    const levelElement = this._getElement('rating-level');
    if (!levelElement) return;

    levelElement.className = 'rating-level';
    levelElement.textContent = level.name;
    levelElement.style.color = level.color;

    // 添加特殊样式
    if (level.name.includes('珍珠')) levelElement.classList.add('level-pearl');
    else if (level.name.includes('黑曜石'))
      levelElement.classList.add('level-obsidian');
    else if (level.name.includes('钻石'))
      levelElement.classList.add('level-diamond');
  }

  _updateFinalStats(stats, finalScore, duration) {
    const updates = {
      final_duration: formatTime(duration),
      final_score: finalScore,
      final_cps: stats.cps.toFixed(2),
      final_accuracy: `${stats.accuracy.toFixed(2)}%`,
      final_max_combo: stats.maxCombo,
    };

    Object.entries(updates).forEach(([id, value]) => {
      this._updateElement(id, value);
    });
  }

  _updateRatingResult(ratingResult) {
    const ratingContainer = document.getElementById('rating-container');
    if (!ratingContainer || !ratingResult?.changed) {
      if (ratingContainer) ratingContainer.style.display = 'none';
      return;
    }

    // 更新等级分结果显示
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

    ratingContainer.style.display = 'block';
  }

  _bindRatingDetailsButton() {
    const button = document.getElementById('rating-details-button');
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showRatingDetails();
    });
  }

  _showRatingDetails() {
    // 检查等级分系统是否可用
    if (!this.ratingSystem) {
      console.error('[UIManager] 等级分系统未初始化');
      this._showErrorModal('等级分系统未初始化，请刷新页面重试。');
      return;
    }

    // 检查是否已有弹窗打开
    if (document.querySelector('.modal-overlay')) {
      console.log('[UIManager] 弹窗已存在，避免重复创建');
      return;
    }

    const ratingData = this.ratingSystem.getRating();
    const records = this.ratingSystem.getBestRecords();

    this._createRatingModal(ratingData, records);
  }

  _createRatingModal(ratingData, records) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    // ESC键关闭功能
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    const closeModal = () => {
      document.removeEventListener('keydown', handleEsc);
      overlay.classList.add('closing');
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
      }, 300);
    };

    // 点击背景关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    const modal = document.createElement('div');
    modal.className = 'rating-details-modal';
    modal.addEventListener('click', (e) => e.stopPropagation());

    // 🔧 修改：优化模态框布局
    modal.innerHTML = `
    <div class="modal-header">
      <h2>玩家等级分详情</h2>
      <button class="modal-close" title="关闭">&times;</button>
    </div>
    <div class="modal-content">
      <div class="current-rating">
        当前等级分: <span>${ratingData.rating.toFixed(1)}</span> 
        <span class="level-badge" style="color:${ratingData.level.color}">${ratingData.level.name}</span>
      </div>
      <div class="game-count">总游戏场次: ${ratingData.games}</div>
      ${this._createRecordsTable(records)}
    </div>
    <div class="modal-footer">
      <button class="modal-button export-button">
        <span class="button-icon">📊</span>
        <span class="button-text">导出记录</span>
      </button>
      <button class="modal-button close-button">
        <span class="button-icon">✖</span>
        <span class="button-text">关闭</span>
      </button>
    </div>
  `;

    // 绑定事件
    modal.querySelector('.modal-close').onclick = closeModal;
    modal.querySelector('.close-button').onclick = closeModal;

    const exportButton = modal.querySelector('.export-button');
    exportButton.onclick = () => this._exportRatingData(records, exportButton);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 添加键盘支持
    document.addEventListener('keydown', handleEsc);

    // 触发显示动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('show');
      });
    });
  }

  _createRecordsTable(records) {
    if (!records || records.length === 0) {
      return '<div class="no-records">暂无游戏记录</div>';
    }

    const tableRows = records
      .map((record, index) => {
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        const maxCombo = record.maxCombo || record.stats?.maxCombo || '-';
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
          <td>${maxCombo}</td>
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
            <th>排名</th>
            <th>等级分</th>
            <th>分数</th>
            <th>准确率</th>
            <th>CPS</th>
            <th>最大连击</th>
            <th>时长</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;
  }

  _exportRatingData(records, button) {
    if (button.disabled) return;

    button.disabled = true;
    const textSpan = button.querySelector('.button-text');
    const iconSpan = button.querySelector('.button-icon');

    textSpan.textContent = '导出中...';

    setTimeout(() => {
      // 准备CSV数据
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
        const maxCombo = record.maxCombo || record.stats?.maxCombo || '-';

        const row = [
          index + 1,
          record.rating.toFixed(1),
          record.score,
          record.accuracy.toFixed(2) + '%',
          record.cps.toFixed(2),
          maxCombo,
          record.duration + 's',
          dateStr,
          record.focusMode ? '是' : '否',
        ];

        csvContent += row.join(',') + '\n';
      });

      // 创建下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `piano-game-ratings-${new Date().toISOString().slice(0, 10)}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 成功反馈
      textSpan.textContent = '已导出';
      iconSpan.innerHTML = '✓';

      setTimeout(() => {
        textSpan.textContent = '导出记录';
        iconSpan.innerHTML = '📊';
        button.disabled = false;
      }, 1500);
    }, 300);
  }

  _showErrorModal(message) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="rating-details-modal error-modal">
        <div class="modal-header">
          <h2>错误</h2>
        </div>
        <div class="modal-content">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-button close-button">
            <span class="button-text">确定</span>
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('.close-button').onclick = () => {
      document.body.removeChild(overlay);
    };

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });
  }
}
