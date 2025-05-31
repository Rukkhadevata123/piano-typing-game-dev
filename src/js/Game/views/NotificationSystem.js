/**
 * 通知系统 - 负责显示各类游戏通知
 */
export class NotificationSystem {
  constructor() {
    this.activeNotifications = new Set();
  }

  /**
   * 显示分数反馈
   */
  showScoreFeedback(scoreDetails, column = null, scoreElement, gameBoard) {
    const isPositive = scoreDetails.points > 0;
    const text = `${scoreDetails.points > 0 ? '+' : ''}${scoreDetails.points}`;

    let position;
    if (column !== null && gameBoard) {
      position = this._getColumnPosition(column, gameBoard);
    } else if (scoreElement) {
      position = this._getElementPosition(scoreElement);
    } else {
      position = { left: '50%', top: '30%' };
    }

    this.showNotification({
      containerId: 'score-feedback-container',
      containerClass: 'score-feedback-container',
      className: `score-popup ${isPositive ? 'positive' : 'negative'}`,
      content: text,
      position,
      duration: 1000,
      animateClass: 'animate', // 使用原有的动画类
    });
  }

  /**
   * 显示连击里程碑
   */
  showComboMilestone(combo, points) {
    // 根据连击数确定级别
    let level = 1;
    if (combo >= 200) level = 4;
    else if (combo >= 100) level = 3;
    else if (combo >= 50) level = 2;

    this.showNotification({
      containerId: 'combo-milestone-container',
      containerClass: 'combo-milestone-container',
      className: `combo-milestone level-${level}`,
      content: `🔥连击 ${combo} 奖励 +${points}`,
      duration: 3500,
      animateClass: 'show',
      animationName: 'comboEffect', // 使用统一的连击动画
    });
  }

  /**
   * 显示连击中断
   */
  showComboBreak(combo, penalty) {
    this.showNotification({
      containerId: 'combo-break-container',
      containerClass: 'combo-milestone-container',
      className: 'combo-milestone combo-break',
      content: `💔连击中断 ${combo} 惩罚 ${penalty}`,
      duration: 2500,
      animateClass: 'show',
      animationName: 'comboEffect', // 使用统一的连击动画
    });
  }

  /**
   * 显示时间切换通知
   */
  showTimeNotification(timeText) {
    this.showNotification({
      containerId: 'system-notification-container',
      containerClass: 'system-notification-container',
      className: 'system-notification time-notification',
      content: `游戏时长: ${timeText}`,
      duration: 1500,
      animateClass: 'show',
    });
  }

  /**
   * 显示模式切换通知
   */
  showModeNotification(modeName) {
    this.showNotification({
      containerId: 'system-notification-container',
      containerClass: 'system-notification-container',
      className: 'system-notification mode-notification',
      content: `游戏模式: ${modeName}`,
      duration: 1500,
      animateClass: 'show',
    });
  }

  /**
   * 显示主题切换通知
   */
  showThemeNotification(themeName) {
    this.showNotification({
      containerId: 'system-notification-container',
      containerClass: 'system-notification-container',
      className: 'system-notification theme-notification',
      content: `主题: ${themeName}`,
      duration: 1500,
      animateClass: 'show',
    });
  }

  /**
   * 通用通知显示函数
   */
  showNotification(options) {
    const {
      containerId,
      containerClass,
      className,
      content,
      position,
      duration = 2000,
      animateClass = 'show',
      animationName = null,
    } = options;

    // 1. 获取或创建容器
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = containerClass;
      document.body.appendChild(container);
    }

    // 2. 创建通知元素
    const notification = document.createElement('div');
    notification.className = className;
    notification.innerHTML = content;

    // 3. 设置位置
    if (position) {
      notification.style.position = 'absolute';
      notification.style.left = `${position.left}px`;
      notification.style.top = `${position.top}px`;
      if (position.origin) {
        notification.style.transformOrigin = position.origin;
      }
    }

    container.appendChild(notification);

    // 4. 处理动画
    requestAnimationFrame(() => {
      notification.classList.add(animateClass);

      // 如果指定了动画名，添加动画结束监听
      if (animationName) {
        const handleAnimationEnd = (event) => {
          if (event.animationName === animationName) {
            notification.remove();
            this.activeNotifications.delete(notification);
          }
        };
        notification.addEventListener('animationend', handleAnimationEnd, {
          once: true,
        });
        this.activeNotifications.add(notification);
      } else {
        // 默认定时移除
        setTimeout(() => {
          notification.remove();
          this.activeNotifications.delete(notification);
        }, duration);
      }
    });

    return notification;
  }

  /**
   * 获取列位置
   */
  _getColumnPosition(column, gameBoard) {
    const rect = gameBoard.getBoundingClientRect();
    const cellSize = 60; // var(--cell-size)
    const gap = 5; // var(--grid-gap)
    const boardPadding = 10; // var(--spacing-small)

    const cellX = boardPadding + column * (cellSize + gap) + cellSize / 2;
    const cellY = rect.height - cellSize / 2;

    return {
      left: rect.left + cellX,
      top: rect.top + cellY,
      origin: 'center bottom',
    };
  }

  /**
   * 获取元素位置
   */
  _getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left + rect.width / 2,
      top: rect.top,
      origin: 'center top',
    };
  }
}
