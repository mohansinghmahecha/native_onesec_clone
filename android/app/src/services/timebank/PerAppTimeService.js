import { loadData, saveData, STORAGE_KEYS, addRecentActivity } from '../../utils/storage';
import { showInfo, showSuccess, showWarning } from '../../utils/toast';

class PerAppTimeService {
  constructor() {
    this.timeLimits = {};
    this.usedTime = {};
    this.lastResetDate = null;
    this.init();
  }

  async init() {
    await this.loadData();
    await this.checkAndReset();
  }

  async loadData() {
    try {
      // Load time limits
      const limits = await loadData(STORAGE_KEYS.APP_TIME_LIMITS);
      if (limits) {
        this.timeLimits = limits;
      } else {
        this.timeLimits = {
          instagram: 30,
          youtube: 30,
          twitter: 15,
          reddit: 30,
          facebook: 30,
        };
        await saveData(STORAGE_KEYS.APP_TIME_LIMITS, this.timeLimits);
      }
      
      // Load used time
      const used = await loadData(STORAGE_KEYS.APP_USED_TIME);
      if (used) {
        this.usedTime = used;
      } else {
        this.usedTime = {};
        await saveData(STORAGE_KEYS.APP_USED_TIME, this.usedTime);
      }
      
      // Load last reset date
      this.lastResetDate = await loadData(STORAGE_KEYS.APP_LAST_RESET);
      
    } catch (error) {
      console.error('Error loading app time data:', error);
    }
  }

  async saveAllData() {
    await saveData(STORAGE_KEYS.APP_TIME_LIMITS, this.timeLimits);
    await saveData(STORAGE_KEYS.APP_USED_TIME, this.usedTime);
    await saveData(STORAGE_KEYS.APP_LAST_RESET, this.lastResetDate);
  }

  async checkAndReset() {
    const today = new Date().toDateString();
    
    if (this.lastResetDate !== today) {
      const apps = Object.keys(this.timeLimits);
      apps.forEach(app => {
        this.usedTime[app] = 0;
      });
      
      this.lastResetDate = today;
      await this.saveAllData();
      showInfo('Daily Reset', 'Your app time limits have been reset for today');
    }
  }

  // ✅ Set time limit for a specific app
  async setAppTimeLimit(appKey, minutes) {
    this.timeLimits[appKey] = minutes;
    this.usedTime[appKey] = this.usedTime[appKey] || 0;
    await this.saveAllData();
    
    const appName = this.getAppName(appKey);
    showSuccess(`${appName} Limit Set`, `${minutes} minutes per day`);
  }

  // ✅ Get time limit for an app
  getTimeLimit(appKey) {
    return this.timeLimits[appKey] || 0;
  }

  // ✅ Get used time for an app
  getUsedTime(appKey) {
    return this.usedTime[appKey] || 0;
  }

  // ✅ Get remaining time for an app
  getRemainingTime(appKey) {
    const limit = this.getTimeLimit(appKey);
    const used = this.getUsedTime(appKey);
    const remaining = limit - used;
    return remaining > 0 ? remaining : 0;
  }

  // ✅ Check if app can be used
  checkAppUsage(appKey) {
    const remaining = this.getRemainingTime(appKey);
    const limit = this.getTimeLimit(appKey);
    const used = this.getUsedTime(appKey);
    
    if (limit === 0) {
      return {
        allowed: true,
        reason: 'no_limit',
        remaining: 999,
        used: 0,
        limit: 0,
        message: `No time limit set`
      };
    }
    
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: 'time_up',
        remaining: 0,
        used: used,
        limit: limit,
        message: `⏰ Time's up! You've used all ${limit} minutes for today.`
      };
    }
    
    return {
      allowed: true,
      reason: 'allowed',
      remaining: remaining,
      used: used,
      limit: limit,
      message: `📱 ${remaining} minutes left today`
    };
  }

  // ✅ Use time for an app
  async useTime(appKey, minutes, appName) {
    const check = this.checkAppUsage(appKey);
    
    if (!check.allowed) {
      return {
        success: false,
        requiresIntervention: true,
        message: check.message,
        remaining: 0
      };
    }
    
    let actualMinutes = minutes;
    if (minutes > check.remaining && check.limit > 0) {
      actualMinutes = check.remaining;
    }
    
    this.usedTime[appKey] = (this.usedTime[appKey] || 0) + actualMinutes;
    await this.saveAllData();
    
    const newRemaining = this.getRemainingTime(appKey);
    
    // Add to recent activity
    await addRecentActivity(`${appName}: Used ${actualMinutes} min, ${newRemaining} min left`);
    
    return {
      success: true,
      usedMinutes: actualMinutes,
      remainingMinutes: newRemaining,
      message: `Used ${actualMinutes} min. ${newRemaining} min left`,
      isPartial: minutes > check.remaining
    };
  }

  // ✅ Add extension time
  async addExtension(appKey, extensionMinutes, appName) {
    // Track extensions separately
    const extensions = await loadData(STORAGE_KEYS.APP_EXTENSIONS) || {};
    const today = new Date().toDateString();
    
    if (!extensions[today]) {
      extensions[today] = {};
    }
    
    if (!extensions[today][appKey]) {
      extensions[today][appKey] = 0;
    }
    
    // Add extension
    extensions[today][appKey] += extensionMinutes;
    await saveData(STORAGE_KEYS.APP_EXTENSIONS, extensions);
    
    // Also add to used time
    this.usedTime[appKey] = (this.usedTime[appKey] || 0) + extensionMinutes;
    await this.saveAllData();
    
    await addRecentActivity(`${appName}: Added ${extensionMinutes} min extension`);
    showWarning('Extension Added', `${extensionMinutes} extra minutes for ${appName}`);
    
    return {
      success: true,
      extensionUsed: extensionMinutes,
      totalUsed: this.usedTime[appKey],
      remaining: this.getRemainingTime(appKey)
    };
  }

  // ✅ Get app display name
  getAppName(appKey) {
    const names = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      twitter: 'X / Twitter',
      reddit: 'Reddit',
      facebook: 'Facebook'
    };
    return names[appKey] || appKey;
  }
}

export default new PerAppTimeService();