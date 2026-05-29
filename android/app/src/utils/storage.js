import AsyncStorage from '@react-native-async-storage/async-storage';
import { showSuccess, showError } from './toast';
import { isDebugMode } from './config';

// Save data
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    if (isDebugMode()) {
      showSuccess('Saved', `${key} saved successfully`);
    }
    return true;
  } catch (error) {
    if (isDebugMode()) {
      showError('Save Failed', error.message);
    }
    return false;
  }
};

// Load data
export const loadData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    return null;
  } catch (error) {
    if (isDebugMode()) {
      showError('Load Failed', error.message);
    }
    return null;
  }
};

// Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    if (isDebugMode()) {
      showSuccess('Removed', `${key} removed`);
    }
    return true;
  } catch (error) {
    if (isDebugMode()) {
      showError('Remove Failed', error.message);
    }
    return false;
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    if (isDebugMode()) {
      showSuccess('Cleared', 'All data cleared');
    }
    return true;
  } catch (error) {
    if (isDebugMode()) {
      showError('Clear Failed', error.message);
    }
    return false;
  }
};

// Add recent activity
export const addRecentActivity = async (message) => {
  try {
    const activities = await loadData(STORAGE_KEYS.RECENT_ACTIVITY) || [];
    const newActivity = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    };
    activities.unshift(newActivity);
    // Keep only last 50 activities
    const trimmed = activities.slice(0, 50);
    await saveData(STORAGE_KEYS.RECENT_ACTIVITY, trimmed);
    return true;
  } catch (error) {
    console.error('Error adding activity:', error);
    return false;
  }
};

// Storage keys
export const STORAGE_KEYS = {
  BLOCKED_APPS: '@blocked_apps',
  APP_SESSION_LIMITS: '@app_session_limits',
  USER_SETTINGS: '@user_settings',
  ANALYTICS_DATA: '@analytics_data',
  INTERVENTION_COUNT: '@intervention_count',
  STREAK_DATA: '@streak_data',
  RECENT_ACTIVITY: '@recent_activity',
  HAS_LAUNCHED: '@has_launched',
  TIME_SETUP_COMPLETE: '@time_setup_complete',
  APP_TIME_LIMITS: '@app_time_limits',
  APP_USED_TIME: '@app_used_time',
  APP_LAST_RESET: '@app_last_reset',
  APP_EXTENSIONS: '@app_extensions',
  ACTIVE_TIMERS: '@active_timers',
  UNLOCKED_APPS: '@unlocked_apps',
  TIME_BANK: '@time_bank',
  TIME_EXTENSIONS: '@time_extensions',
};