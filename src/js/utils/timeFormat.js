/**
 * 时间格式化工具
 */
export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds}秒`;
  if (remainingSeconds === 0) return `${minutes}分钟`;
  return `${minutes}分${remainingSeconds}秒`;
}
