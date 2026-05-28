// D:\CEO\IntentionalSpace\android\app\src\services\accessibility\AppUnlockReceiver.js
import { DeviceEventEmitter } from 'react-native';
import TimerService from '../timer/TimerService';
import { showSuccess } from '../../utils/toast';

class AppUnlockReceiver {
  constructor() {
    this.setupNativeListener();
  }

  setupNativeListener() {
    try {
      // Listen for unlock events from native OverlayService
      DeviceEventEmitter.addListener('APP_UNLOCKED', this.handleUnlock.bind(this));
      console.log('✅ App unlock receiver setup complete');
    } catch (error) {
      console.error('Error setting up receiver:', error);
    }
  }

  handleUnlock(event) {
    const { packageName, appName, minutes } = event;
    
    if (packageName && minutes) {
      // Directly call TimerService to unlock the app
      TimerService.unlockApp(packageName, appName, minutes);
      showSuccess('App Unlocked', `${appName} unlocked for ${minutes} minutes`);
    }
  }
}

export default new AppUnlockReceiver();