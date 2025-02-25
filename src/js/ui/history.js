import { formatTime } from '@js/utils/timeFormat.js';
import { safeStorage } from '@js/utils/safeStorage.js';

export class HistoryManager {
  constructor() {
    this.history = safeStorage.get('gameHistory', []);
    this.lastUpdateTime = 0;
  }

  updateHistory(duration, mode, stats, score) {
    // 防抖处理
    if (Date.now() - this.lastUpdateTime < 1000) return;
    this.lastUpdateTime = Date.now();

    const entry = this._createHistoryEntry(duration, mode, stats, score);
    if (this._isDuplicateEntry(entry)) return;

    this._updateHistoryData(entry);
    this._updateHistoryUI(entry);
  }

  _createHistoryEntry(duration, mode, stats, score) {
    return {
      duration,
      mode,
      stats: { ...stats }, // 创建副本
      finalScore: score,
      timestamp: Date.now(),
    };
  }

  _isDuplicateEntry(newEntry) {
    return this.history.some(
      (entry) =>
        Math.abs(entry.timestamp - newEntry.timestamp) < 1000 &&
        entry.finalScore === newEntry.finalScore
    );
  }

  _updateHistoryData(entry) {
    this.history.push(entry);
    if (this.history.length > 3) {
      this.history = this.history.slice(-3);
    }
    safeStorage.set('gameHistory', this.history);
  }

  _updateHistoryUI(entry) {
    const container = document.getElementById('history-stats');
    if (!container) return;

    const entryDiv = this._createHistoryEntryElement(entry);
    this._manageHistoryContainer(container, entryDiv);
  }

  _createHistoryEntryElement(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'history-entry';
    entryDiv.innerHTML = `
      <div class="history-header">
        <span>时长: ${formatTime(entry.duration)}</span>
        <span>模式: ${entry.mode === 'row' ? '整行' : '单块'}</span>
      </div>
      <div>得分: ${entry.finalScore}</div>
      <div>CPS: ${entry.stats.cps}</div>
      <div>准确率: ${entry.stats.accuracy}%</div>
      <div>最大连击: ${entry.stats.maxCombo}</div>
    `;
    return entryDiv;
  }

  _manageHistoryContainer(container, newEntry) {
    while (container.children.length >= 3) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(newEntry);
  }
}
