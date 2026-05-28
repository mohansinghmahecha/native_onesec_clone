// D:\CEO\IntentionalSpace\src\utils\storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save data
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log('✅ Data saved:', key);
    return true;
  } catch (error) {
    console.error('❌ Error saving data:', error);
    return false;
  }
};

// Load data
export const loadData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue != null) {
      console.log('✅ Data loaded:', key);
      return JSON.parse(jsonValue);
    }
    console.log('📭 No data found for key:', key);
    return null;
  } catch (error) {
    console.error('❌ Error loading data:', error);
    return null;
  }
};

// Remove data
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log('🗑️ Data removed:', key);
    return true;
  } catch (error) {
    console.error('❌ Error removing data:', error);
    return false;
  }
};

// Get all keys
export const getAllKeys = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('🔑 All keys:', keys);
    return keys;
  } catch (error) {
    console.error('❌ Error getting keys:', error);
    return [];
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('🧹 All data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

// Storage keys
export const STORAGE_KEYS = {
  BLOCKED_APPS: '@blocked_apps',
  USER_SETTINGS: '@user_settings',
  ANALYTICS_DATA: '@analytics_data',
  INTERVENTION_COUNT: '@intervention_count',
  STREAK_DATA: '@streak_data',
};