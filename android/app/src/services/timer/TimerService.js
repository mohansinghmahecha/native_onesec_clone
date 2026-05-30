// D:\CEO\IntentionalSpace\src\services\timer\TimerService.js
import { showSuccess, showInfo, showError } from '../../utils/toast';
import { saveData, loadData, STORAGE_KEYS } from '../../utils/storage';
import NotificationService from '../notifications/NotificationService';
import { clearNativeUnlock, notifyNativeUnlockExpired } from '../../utils/nativeSync';

class TimerService {
  constructor() {
    this.timers = [];
    this.unlockedApps = [];
    this.intervalId = null;
    this.loadTimers();
    this.startTimerCheck();
  }

  async loadTimers() {
    try {
      const saved = await loadData(STORAGE_KEYS.ACTIVE_TIMERS);
      if (saved && Array.isArray(saved)) {
        this.timers = saved;
      }
      
      const unlocked = await loadData(STORAGE_KEYS.UNLOCKED_APPS);
      if (unlocked && Array.isArray(unlocked)) {
        this.unlockedApps = unlocked;
      }
      
      console.log(`📊 Loaded ${this.timers.length} active timers`);
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  }

  async saveTimers() {
    await saveData(STORAGE_KEYS.ACTIVE_TIMERS, this.timers);
    await saveData(STORAGE_KEYS.UNLOCKED_APPS, this.unlockedApps);
  }

  startTimerCheck() {
    // Check every second for expired timers
    this.intervalId = setInterval(() => {
      this.checkExpiredTimers();
    }, 1000);
  }

  checkExpiredTimers() {
    const now = Date.now();
    let hasChanges = false;

    // Check for expired timers
    this.timers = this.timers.filter(timer => {
      if (timer.expiresAt <= now) {
        console.log(`⏰ Timer expired for: ${timer.packageName}`);
        hasChanges = true;
        return false;
      }
      return true;
    });

    // Check for expired unlocked apps
    this.unlockedApps = this.unlockedApps.filter(app => {
      if (app.expiresAt <= now) {
        console.log(`🔒 App locked: ${app.packageName}`);
        clearNativeUnlock(app.packageName)
          .then(() => notifyNativeUnlockExpired(app.packageName))
          .catch(() => {});
        NotificationService.showAppLockedNotification(app.appName);
        hasChanges = true;
        return false;
      }
      return true;
    });

    if (hasChanges) {
      this.saveTimers();
    }
  }

  /** Sync JS timer state when native already granted unlock (overlay path). */
  syncFromNativeUnlock(packageName, appName, minutes) {
    try {
      const expiresAt = Date.now() + minutes * 60 * 1000;
      this.lockApp(packageName, false);
      this.timers = this.timers.filter(t => t.packageName !== packageName);
      this.timers.push({
        id: Date.now().toString(),
        packageName,
        appName,
        minutes,
        expiresAt,
        startTime: Date.now(),
      });
      this.unlockedApps = this.unlockedApps.filter(a => a.packageName !== packageName);
      this.unlockedApps.push({ packageName, appName, expiresAt, minutes });
      this.saveTimers();
    } catch (error) {
      console.error('syncFromNativeUnlock failed:', error);
    }
  }

  unlockApp(packageName, appName, minutes) {
    try {
      const id = Date.now().toString();
      const expiresAt = Date.now() + (minutes * 60 * 1000);
      
      // Remove any existing timer for this app
      this.lockApp(packageName, false);
      
      const timer = {
        id,
        packageName,
        appName,
        minutes,
        expiresAt,
        startTime: Date.now()
      };
      
      this.timers.push(timer);
      this.unlockedApps.push({ 
        packageName, 
        appName, 
        expiresAt,
        minutes 
      });
      
      this.saveTimers();
      
      // Show notification
      NotificationService.showAppUnlockedNotification(appName, minutes);
      showSuccess('App Unlocked', `${appName} unlocked for ${minutes} minutes`);
      
      console.log(`🔓 Unlocked ${appName} for ${minutes} minutes (ID: ${id})`);
      
      return id;
    } catch (error) {
      showError('Unlock Failed', error.message);
      return null;
    }
  }

  lockApp(packageName, showNotification = true) {
    const lockedApp = this.unlockedApps.find(app => app.packageName === packageName);
    
    this.timers = this.timers.filter(t => t.packageName !== packageName);
    this.unlockedApps = this.unlockedApps.filter(app => app.packageName !== packageName);
    this.saveTimers();
    
    if (showNotification && lockedApp) {
      showInfo('App Locked', `${lockedApp.appName} is now locked again`);
      NotificationService.showAppLockedNotification(lockedApp.appName);
    }
    
    console.log(`🔒 Locked: ${packageName}`);
  }

  isAppUnlocked(packageName) {
    const now = Date.now();
    const unlocked = this.unlockedApps.find(app => app.packageName === packageName);
    
    if (unlocked && unlocked.expiresAt > now) {
      const remainingMin = Math.ceil((unlocked.expiresAt - now) / 1000 / 60);
      console.log(`✅ ${unlocked.appName} unlocked (${remainingMin} min left)`);
      return true;
    }
    return false;
  }

  getRemainingTime(packageName) {
    const unlocked = this.unlockedApps.find(app => app.packageName === packageName);
    if (unlocked && unlocked.expiresAt > Date.now()) {
      const remainingMs = unlocked.expiresAt - Date.now();
      const minutes = Math.floor(remainingMs / 1000 / 60);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      return { minutes, seconds, totalMs: remainingMs };
    }
    return { minutes: 0, seconds: 0, totalMs: 0 };
  }

  getAllActiveTimers() {
    return this.timers.map(timer => ({
      ...timer,
      remaining: this.getRemainingTime(timer.packageName)
    }));
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export default new TimerService();