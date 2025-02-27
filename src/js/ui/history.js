import { formatTime } from '@js/utils/timeFormat.js';
import { safeStorage } from '@js/utils/safeStorage.js';

const MAX_ENTRIES = 3;
const STORAGE_KEY = 'gameHistory';

export class HistoryManager {
  #history = [];

  constructor() {
    console.log('[HistoryManager] 初始化');
    try {
      const savedHistory = safeStorage.get(STORAGE_KEY, []);
      console.log('[HistoryManager] 从存储加载历史记录原始数据');

      // 验证并修复已保存的历史记录
      this.#history = savedHistory.map((entry) => {
        console.log('[HistoryManager] 处理历史条目:', entry);
        return {
          duration: entry.duration || 0,
          mode: entry.mode || 'column',
          score: entry.score || 0,
          timestamp: entry.timestamp || Date.now(),
          stats: {
            accuracy: entry.stats?.accuracy || 0,
            cps: entry.stats?.cps || 0,
            maxCombo: entry.stats?.maxCombo || 0,
            currentCombo: entry.stats?.currentCombo || 0,
          },
        };
      });

      console.log(`[HistoryManager] 加载了 ${this.#history.length} 条历史记录`);
    } catch (error) {
      console.error('[HistoryManager] 加载历史记录失败:', error);
      this.#history = [];
    }
  }

  updateHistory(duration, mode, stats, score) {
    console.log('[HistoryManager] 更新历史记录', {
      duration,
      mode,
      stats,
      score,
    });

    // 验证并确保 stats 对象包含所有必要的属性
    const validatedStats = {
      accuracy: Number(stats?.accuracy || 0),
      cps: Number(stats?.cps || 0),
      maxCombo: Number(stats?.maxCombo || 0),
      currentCombo: Number(stats?.currentCombo || 0),
    };

    console.log('[HistoryManager] 验证后的统计数据:', validatedStats);

    const entry = {
      duration,
      mode,
      stats: validatedStats,
      score,
      timestamp: Date.now(),
    };

    console.log('[HistoryManager] 创建新的历史条目:', entry);

    this.#history.push(entry);
    if (this.#history.length > MAX_ENTRIES) {
      console.log('[HistoryManager] 历史记录超出最大数量，移除最早的条目');
      this.#history.shift(); // 移除最早的条目
    }

    this.#save();
    this.#updateUI(entry);
  }

  #save() {
    console.log('[HistoryManager] 保存历史记录到存储');
    try {
      // 创建安全的副本以确保序列化正确
      const safeHistory = this.#history.map((entry) => ({
        duration: entry.duration,
        mode: entry.mode,
        score: entry.score,
        timestamp: entry.timestamp,
        stats: {
          accuracy: entry.stats?.accuracy || 0,
          cps: entry.stats?.cps || 0,
          maxCombo: entry.stats?.maxCombo || 0,
          currentCombo: entry.stats?.currentCombo || 0,
        },
      }));

      console.log(`[HistoryManager] 保存 ${safeHistory.length} 条历史记录`);
      safeStorage.set(STORAGE_KEY, safeHistory);
    } catch (error) {
      console.error('[HistoryManager] 保存历史记录失败:', error);
    }
  }

  #updateUI(entry) {
    console.log('[HistoryManager] 更新历史记录UI');
    const container = document.getElementById('history-stats');
    if (!container) {
      console.warn('[HistoryManager] 找不到历史记录容器元素');
      return;
    }

    // 安全访问，提供默认值
    const { duration, mode, score, stats = {} } = entry;
    const accuracy = stats?.accuracy || 0;
    const cps = stats?.cps || 0;
    const maxCombo = stats?.maxCombo || 0;

    console.log('[HistoryManager] 显示历史记录:', {
      duration,
      mode,
      score,
      accuracy,
      cps,
      maxCombo,
    });

    const div = document.createElement('div');
    div.className = 'history-entry';
    div.innerHTML = `
      <div class="history-header">
        <span>时长: ${formatTime(duration)}</span>
        <span>模式: ${mode === 'row' ? '整行' : '单块'}</span>
      </div>
      <div>得分: ${score}</div>
      <div>CPS: ${cps}</div>
      <div>准确率: ${accuracy}%</div>
      <div>最大连击: ${maxCombo}</div>
    `;

    while (container.children.length >= MAX_ENTRIES) {
      console.log('[HistoryManager] 移除旧的历史UI元素以保持最大数量');
      container.removeChild(container.firstChild);
    }

    console.log('[HistoryManager] 添加新的历史UI元素');
    container.appendChild(div);
  }

  getHistory() {
    console.log(`[HistoryManager] 获取历史记录 (${this.#history.length} 条)`);
    return [...this.#history];
  }

  clear() {
    console.log('[HistoryManager] 清除所有历史记录');
    this.#history = [];
    this.#save();
    const container = document.getElementById('history-stats');
    if (container) {
      console.log('[HistoryManager] 清除历史记录UI');
      container.innerHTML = '';
    } else {
      console.warn('[HistoryManager] 找不到历史记录容器元素，无法清除UI');
    }
  }
}
