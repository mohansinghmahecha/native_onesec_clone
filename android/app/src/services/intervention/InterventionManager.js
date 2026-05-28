// D:\CEO\IntentionalSpace\src\services\intervention\InterventionManager.js
import { AppState, NativeEventEmitter, NativeModules } from 'react-native';
import TimerService from '../timer/TimerService';
import NotificationService from '../notifications/NotificationService';
import { loadData, saveData, STORAGE_KEYS } from '../../utils/storage';
import { showInfo } from '../../utils/toast';

class InterventionManager {
  constructor() {
    this.isInterventionActive = false;
    this.currentApp = null;
    this.setupAppStateListener();
  }

  setupAppStateListener() {
    AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        await this.checkPendingTimers();
      }
    });
  }

  async checkPendingTimers() {
    const activeTimers = TimerService.getAllActiveTimers();
    if (activeTimers.length > 0) {
      console.log(`⏰ ${activeTimers.length} active timers`);
      activeTimers.forEach(timer => {
        if (timer.remaining.minutes < 1 && timer.remaining.seconds > 0) {
          showInfo('Time Almost Up', `${timer.appName} will lock soon`);
        }
      });
    }
  }

  async onAppOpened(packageName, appName) {
    // Check if app is already unlocked
    if (TimerService.isAppUnlocked(packageName)) {
      const remaining = TimerService.getRemainingTime(packageName);
      console.log(`✅ ${appName} already unlocked (${remaining.minutes} min left)`);
      return true;
    }

    // Check if app is blocked
    const isBlocked = await this.isAppBlocked(packageName);
    if (!isBlocked) {
      console.log(`✅ ${appName} is not blocked`);
      return true;
    }

    // Trigger intervention
    console.log(`🔴 Intervention triggered for ${appName}`);
    this.currentApp = { packageName, appName };
    this.isInterventionActive = true;
    
    // Track attempt
    await this.trackAttempt(packageName, appName);
    
    return false; // App is blocked, needs intervention
  }

  async isAppBlocked(packageName) {
    const blockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
    if (!blockedApps) return true; // Default to blocked
    
    // Map package to app key
    const appKey = this.getAppKeyFromPackage(packageName);
    return blockedApps[appKey] === true;
  }

  getAppKeyFromPackage(packageName) {
    const mapping = {
      'com.instagram.android': 'instagram',
      'com.google.android.youtube': 'youtube',
      'com.twitter.android': 'twitter',
      'com.reddit.frontpage': 'reddit',
      'com.facebook.katana': 'facebook',
    };
    return mapping[packageName] || packageName;
  }

  async trackAttempt(packageName, appName) {
    try {
      const analytics = await loadData(STORAGE_KEYS.ANALYTICS_DATA) || {
        totalAttempts: 0,
        todayAttempts: 0,
        lastAttemptDate: null,
        totalTimeSaved: 0
      };
      
      const today = new Date().toDateString();
      if (analytics.lastAttemptDate !== today) {
        analytics.todayAttempts = 0;
        analytics.lastAttemptDate = today;
      }
      
      analytics.totalAttempts++;
      analytics.todayAttempts++;
      
      await saveData(STORAGE_KEYS.ANALYTICS_DATA, analytics);
      
      // Show warning after 10 attempts
      if (analytics.todayAttempts === 10) {
        showInfo('High Usage', `You've tried to open apps ${analytics.todayAttempts} times today`);
      }
    } catch (error) {
      console.error('Error tracking attempt:', error);
    }
  }

  async onInterventionComplete(packageName, minutes) {
    const appName = this.currentApp?.appName || 'App';
    TimerService.unlockApp(packageName, appName, minutes);
    this.isInterventionActive = false;
    this.currentApp = null;
    
    // Track time saved (prevented minutes)
    await this.trackTimeSaved(minutes);
  }

  async trackTimeSaved(minutes) {
    try {
      const analytics = await loadData(STORAGE_KEYS.ANALYTICS_DATA) || {};
      analytics.totalTimeSaved = (analytics.totalTimeSaved || 0) + minutes;
      analytics.todayTimeSaved = (analytics.todayTimeSaved || 0) + minutes;
      
      await saveData(STORAGE_KEYS.ANALYTICS_DATA, analytics);
      
      // Show notification for time saved milestones
      await NotificationService.showTimeSavedNotification(analytics.todayTimeSaved);
      await NotificationService.updateStreak(analytics.todayTimeSaved);
    } catch (error) {
      console.error('Error tracking time saved:', error);
    }
  }

  isInterventionNeeded() {
    return this.isInterventionActive;
  }

  getCurrentApp() {
    return this.currentApp;
  }
}

export default new InterventionManager();