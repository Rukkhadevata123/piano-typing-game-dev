/**
 * 游戏核心配置
 */
export const gameConfig = {
  rows: 9, // 游戏板行数
  columns: 6, // 游戏板列数
  initialDuration: 60, // 初始游戏时长（秒）
  points: {
    hit: 10, // 命中得分
    miss: -5, // 未命中扣分
  },
  difficulty: {
    minRate: 0.3, // 最小方块生成概率
    maxRate: 0.6, // 最大方块生成概率
    initialRate: 0.4, // 初始生成概率
    minBlocks: 1, // 每行最少方块数
    maxBlocks: 4, // 每行最多方块数
    maxConsecutive: 3, // 最大连续方块数
  },
  timeDurations: [60, 90, 120, 150, 180, 210, 240, 270, 300, 5], // 可选游戏时长（秒）
  modes: [
    { name: '整行模式', type: 'row' },
    { name: '单块模式', type: 'single' },
  ],
};
