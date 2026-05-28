// D:\CEO\IntentionalSpace\src\services\notifications\NotificationService.js
import { Platform, Alert } from 'react-native';
import { showInfo, showSuccess } from '../../utils/toast';

class NotificationService {
  constructor() {
    this.streakCount = 0;
    this.lastNotificationDate = null;
  }

  async showStreakNotification(streak) {
    if (streak > 0 && streak % 5 === 0) {
      showSuccess('Milestone!', `${streak} day streak! Keep going! 🎉`);
    }
  }

  async showTimeSavedNotification(minutesSaved) {
    if (minutesSaved >= 60) {
      showSuccess('Time Saved', `You've saved ${Math.floor(minutesSaved / 60)} hours today!`);
    } else if (minutesSaved >= 30) {
      showSuccess('Great Job!', `You saved ${minutesSaved} minutes today`);
    }
  }

  async showReminder() {
    const now = new Date();
    const hour = now.getHours();
    
    // Remind at 9 PM if user hasn't been mindful
    if (hour === 21) {
      showInfo('Evening Check-in', 'How was your screen time today?');
    }
  }

  async showAppUnlockedNotification(appName, minutes) {
    showSuccess('App Unlocked', `${appName} unlocked for ${minutes} minutes. Be mindful!`);
  }

  async showAppLockedNotification(appName) {
    showInfo('App Locked', `${appName} is now locked again`);
  }
}

export default new NotificationService();