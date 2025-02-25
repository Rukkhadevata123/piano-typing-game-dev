/**
 * 通知系统模块
 * 负责游戏内各类提示的显示
 */

export class NotificationManager {
  static show(message, duration = 1500) {
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), duration);
  }

  static showTheme(themeName) {
    this.show(`主题: ${themeName}`);
  }

  static showTime(timeText) {
    this.show(`游戏时长: ${timeText}`);
  }

  static showMode(modeName) {
    this.show(`游戏模式: ${modeName}`);
  }
}
