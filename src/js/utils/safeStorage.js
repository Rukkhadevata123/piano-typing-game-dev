export const safeStorage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item === null ? defaultValue : JSON.parse(item);
    } catch (error) {
      console.warn(`Error reading from storage (${key}):`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage (${key}):`, error);
      return false;
    }
  },

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
