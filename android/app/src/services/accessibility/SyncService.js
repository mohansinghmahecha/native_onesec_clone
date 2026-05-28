// D:\CEO\IntentionalSpace\src\services\accessibility\SyncService.js
import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';
import { loadData, STORAGE_KEYS } from '../../utils/storage';
import { showSuccess, showError, showInfo } from '../../utils/toast';

const { IntentionalSpaceModule } = NativeModules;

class SyncService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for app opened events from native
    DeviceEventEmitter.addListener('app_opened', async (data) => {
      console.log('App opened:', data);
      showInfo('App Detected', `${data.appName} was opened`);
    });
  }

  async syncBlockedAppsToNative() {
    try {
      const blockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
      if (blockedApps && IntentionalSpaceModule) {
        IntentionalSpaceModule.syncBlockedApps(JSON.stringify(blockedApps));
        showSuccess('Synced', 'Blocked apps synced with system');
      }
    } catch (error) {
      showError('Sync Failed', error.message);
    }
  }

  async syncSettingsToNative() {
    try {
      const settings = await loadData(STORAGE_KEYS.USER_SETTINGS);
      if (settings && IntentionalSpaceModule) {
        IntentionalSpaceModule.syncSettings(JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Sync settings error:', error);
    }
  }
}

export default new SyncService();