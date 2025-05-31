/**
 * 游戏核心配置 - 新架构专用
 */
export const gameConfig = {
  // 游戏板配置
  board: {
    rows: 9,
    columns: 6,
  },

  // 时间配置
  time: {
    initial: 60,
    options: [60, 90, 120, 150, 180, 210, 240, 270, 300, 5],
  },

  // 得分配置
  points: {
    hit: 10,
    miss: -5,
  },

  // 难度配置
  difficulty: {
    generation: {
      minRate: 0.3,
      maxRate: 0.6,
      initialRate: 0.4,
    },
    blocks: {
      minPerRow: 1,
      maxPerRow: 4,
      maxConsecutive: 3,
    },
  },

  // 游戏模式
  modes: [
    { name: '整行模式', type: 'row' },
    { name: '单块模式', type: 'single' },
  ],
};
