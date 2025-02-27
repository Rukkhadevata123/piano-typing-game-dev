/**
 * 安全的本地存储工具
 * 对 localStorage 的操作进行封装，提供错误处理和类型安全
 * @namespace safeStorage
 */
export const safeStorage = {
  /**
   * 从本地存储中获取数据
   * @param {string} key - 存储键名
   * @param {*} defaultValue - 当键不存在或发生错误时的默认值
   * @returns {*} 解析后的存储值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item === null ? defaultValue : JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading from storage (${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * 将数据保存到本地存储
   * @param {string} key - 存储键名
   * @param {*} value - 要存储的值(将被JSON序列化)
   * @returns {boolean} 操作是否成功
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  },

  /**
   * 从本地存储中删除数据
   * @param {string} key - 要删除的键名
   * @returns {boolean} 操作是否成功
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage (${key}):`, error);
      return false;
    }
  },
};
