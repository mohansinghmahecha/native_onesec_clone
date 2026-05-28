// D:\CEO\IntentionalSpace\src\utils\storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showSuccess, showError } from './toast';

// Save data
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    showSuccess('Saved', `${key} saved successfully`);
    return true;
  } catch (error) {
    showError('Save Failed', error.message);
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
    showError('Load Failed', error.message);
    return null;
  }
};

// Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    showSuccess('Removed', `${key} removed`);
    return true;
  } catch (error) {
    showError('Remove Failed', error.message);
    return false;
  }
};

// Storage keys
export const STORAGE_KEYS = {
  BLOCKED_APPS: '@blocked_apps',
  USER_SETTINGS: '@user_settings',
  UNLOCKED_APPS: '@unlocked_apps', // For timer service
  ACTIVE_TIMERS: '@active_timers',
};