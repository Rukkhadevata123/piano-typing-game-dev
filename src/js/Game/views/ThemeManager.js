import { themes } from '@js/config/themeConfig.js';
import { safeStorage } from '@js/utils/safeStorage.js';

/**
 * 主题管理器 - 负责主题切换和应用
 */
export class ThemeManager {
  constructor() {
    this.currentThemeIndex = parseInt(safeStorage.get('currentTheme', '0'));
  }

  getCurrentThemeIndex() {
    return this.currentThemeIndex;
  }

  applyCurrentTheme() {
    const theme = themes[this.currentThemeIndex];
    const primaryColor = theme.color || theme.colors[0];

    // 🔧 同时设置所有相关的CSS变量
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty(
      '--secondary-color',
      theme.secondary
    );
    document.documentElement.style.setProperty('--cell-color', primaryColor); // 🆕 添加这行

    return theme;
  }

  switchTheme() {
    this.currentThemeIndex = (this.currentThemeIndex + 1) % themes.length;
    safeStorage.set('currentTheme', this.currentThemeIndex);
    const theme = this.applyCurrentTheme();
    return theme.name;
  }
}
