import { formatTime } from '@js/utils/timeFormat.js';
import { safeStorage } from '@js/utils/safeStorage.js';

const MAX_ENTRIES = 3;
const STORAGE_KEY = 'gameHistory';

export class HistoryManager {
  #history = [];

  constructor() {
    console.log('[History] 初始化');
    this.#history = safeStorage.get(STORAGE_KEY, []);
  }

  updateHistory(duration, mode, stats, score) {
    const entry = {
      duration,
      mode,
      stats,
      score,
      timestamp: Date.now(),
    };

    console.log('[History] 添加新记录');
    this.#history.push(entry);

    // 保持最大记录数
    if (this.#history.length > MAX_ENTRIES) {
      this.#history.shift();
    }

    safeStorage.set(STORAGE_KEY, this.#history);
    this.#updateUI(entry);
  }

  #updateUI(entry) {
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
    while (container.children.length >= MAX_ENTRIES) {
      container.removeChild(container.firstChild);
    }

    container.appendChild(div);
  }
}
