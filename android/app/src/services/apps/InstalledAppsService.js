import { NativeModules, Platform } from 'react-native';
import { loadData, saveData, STORAGE_KEYS } from '../../utils/storage';
import { showError } from '../../utils/toast';

const { AppListModule } = NativeModules;

class InstalledAppsService {
  constructor() {
    this.allApps = [];
    this.userApps = [];
    this.loaded = false;
  }

  // Get all installed apps
  async getInstalledApps() {
    try {
      if (Platform.OS === 'android' && AppListModule) {
        const apps = await AppListModule.getInstalledApps();
        this.allApps = apps;
        this.userApps = apps.filter(app => !app.isSystemApp);
        this.loaded = true;
        return this.userApps;
      }
      return this.getMockApps();
    } catch (error) {
      console.error('Error getting installed apps:', error);
      showError('Error', 'Failed to load installed apps');
      return this.getMockApps();
    }
  }

  // Search apps by name
  searchApps(query) {
    if (!query) return this.userApps;
    const lowerQuery = query.toLowerCase();
    return this.userApps.filter(app => 
      app.appName.toLowerCase().includes(lowerQuery) ||
      app.packageName.toLowerCase().includes(lowerQuery)
    );
  }

  // Get app icon
  getAppIcon(packageName) {
    const app = this.allApps.find(a => a.packageName === packageName);
    return app?.icon || null;
  }

  // Mock apps for testing (fallback)
  getMockApps() {
    return [
      { packageName: 'com.instagram.android', appName: 'Instagram', isSystemApp: false },
      { packageName: 'com.google.android.youtube', appName: 'YouTube', isSystemApp: false },
      { packageName: 'com.twitter.android', appName: 'X / Twitter', isSystemApp: false },
      { packageName: 'com.reddit.frontpage', appName: 'Reddit', isSystemApp: false },
      { packageName: 'com.facebook.katana', appName: 'Facebook', isSystemApp: false },
      { packageName: 'com.snapchat.android', appName: 'Snapchat', isSystemApp: false },
      { packageName: 'com.whatsapp', appName: 'WhatsApp', isSystemApp: false },
      { packageName: 'com.spotify.music', appName: 'Spotify', isSystemApp: false },
      { packageName: 'com.netflix.mediaclient', appName: 'Netflix', isSystemApp: false },
      { packageName: 'com.tiktok.android', appName: 'TikTok', isSystemApp: false },
    ];
  }

  // Sync blocked apps to native
  async syncBlockedAppsToNative() {
    try {
      const blockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
      // Currently just log - native sync can be added later
      console.log('Blocked apps:', blockedApps);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }
}

export default new InstalledAppsService();