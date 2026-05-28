// D:\CEO\IntentionalSpace\src\utils\syncToNative.js
import { NativeModules, Platform } from 'react-native';
import { loadData, STORAGE_KEYS } from './storage';
import { showSuccess, showError } from './toast';

const { IntentionalSpaceModule } = NativeModules;

export const syncBlockedAppsToNative = async () => {
  try {
    const blockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
    if (blockedApps) {
      // For now, just log - native module is optional
      console.log('Syncing blocked apps to native:', blockedApps);
      
      // If native module exists, use it
      if (IntentionalSpaceModule?.syncBlockedApps) {
        await IntentionalSpaceModule.syncBlockedApps(JSON.stringify(blockedApps));
        showSuccess('Synced', 'Settings saved to system');
      }
      return true;
    }
  } catch (error) {
    console.error('Sync error:', error);
    showError('Sync Failed', error.message);
    return false;
  }
};

export const syncSettingsToNative = async () => {
  try {
    const settings = await loadData(STORAGE_KEYS.USER_SETTINGS);
    if (settings && IntentionalSpaceModule?.syncSettings) {
      await IntentionalSpaceModule.syncSettings(JSON.stringify(settings));
    }
  } catch (error) {
    console.error('Sync settings error:', error);
  }
};