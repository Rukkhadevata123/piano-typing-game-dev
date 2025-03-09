/**
 * 通知系统 - 负责显示各类游戏通知
 */
export class NotificationSystem {
  /**
   * 通用通知显示函数
   * @param {Object} options 配置选项
   */
  showNotification(options) {
    const {
      containerId = 'notification-container',
      containerClass = 'notification-container',
      content,
      className,
      duration = 2500,
      position = null,
      animateClass = 'show',
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
    notification.textContent = content;

    // 3. 处理位置
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
      setTimeout(() => {
        notification.remove();
      }, duration);
    });

    return notification;
  }

  showScoreFeedback(
    scoreDetails,
    column = null,
    scoreElement,
    gameBoardElement
  ) {
    const isPositive = scoreDetails.points > 0;

    // 设置内容
    let content = `${isPositive ? '+' : ''}${scoreDetails.points}`;

    // 只在非里程碑命中时显示连击信息
    if (
      isPositive &&
      scoreDetails.multipliers.combo > 1 &&
      scoreDetails.details.milestoneBonus === 0
    ) {
      content += ` 连击×${parseFloat(scoreDetails.multipliers.combo).toFixed(1)}`;
    } else if (scoreDetails.details.comboPenalty > 0) {
      content += ` (-${scoreDetails.details.comboPenalty})`;
    }

    // 计算显示位置
    let position = null;

    if (isPositive && column !== null) {
      // 命中显示在方块上方
      if (gameBoardElement) {
        const cells = gameBoardElement.querySelectorAll(
          `.cell[data-col="${column}"]`
        );
        if (cells.length > 0) {
          const lastCell = cells[cells.length - 1];
          const rect = lastCell.getBoundingClientRect();
          position = {
            left: rect.left + rect.width / 2,
            top: rect.top - 15,
          };
        }
      }
    } else {
      // 失误显示在分数右侧
      if (scoreElement) {
        const rect = scoreElement.getBoundingClientRect();
        position = {
          left: rect.right + 15,
          top: rect.top + rect.height / 2,
          origin: 'left center',
        };
      }
    }

    this.showNotification({
      containerId: 'score-feedback-container',
      containerClass: 'score-feedback-container',
      className: `score-popup ${isPositive ? 'positive' : 'negative'}`,
      content: content,
      position: position,
      animateClass: isPositive ? 'animate' : 'animate-score',
      duration: isPositive ? 1000 : 800,
    });
  }

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
      // 使用comboEffect动画
      animateClass: 'show',
    });
  }

  showComboBreak(combo, penalty) {
    this.showNotification({
      containerId: 'combo-milestone-container',
      containerClass: 'combo-milestone-container',
      className: 'combo-milestone combo-break',
      content: `💔连击中断 ${combo} 惩罚 -${penalty}`,
      duration: 2500,
      // 使用 'show' 类触发动画
      animateClass: 'show',
    });
  }
}
