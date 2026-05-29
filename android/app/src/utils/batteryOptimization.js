import { NativeModules, Platform, Linking, Alert } from 'react-native';
import { showInfo, showWarning } from './toast';

const { BatteryOptimizationModule } = NativeModules;

export const isIgnoringBatteryOptimizations = async () => {
  if (Platform.OS !== 'android') return true;
  
  try {
    if (BatteryOptimizationModule) {
      return await BatteryOptimizationModule.isIgnoringBatteryOptimizations();
    }
    return false;
  } catch (error) {
    console.error('Error checking battery optimization:', error);
    return false;
  }
};

export const requestIgnoreBatteryOptimizations = () => {
  if (Platform.OS !== 'android') return;
  
  Alert.alert(
    '🔋 Battery Optimization',
    'For IntentionalSpace to work properly, please disable battery optimization.\n\n' +
    'This allows the app to:\n' +
    '• Detect when you open apps\n' +
    '• Show intervention screens\n' +
    '• Track your daily time limits\n\n' +
    'Without this, the app may not work correctly.',
    [
      { text: 'Later', style: 'cancel' },
      { 
        text: 'Disable', 
        onPress: () => {
          Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
        }
      }
    ]
  );
};

export const checkAndRequestBatteryOptimization = async () => {
  const isIgnoring = await isIgnoringBatteryOptimizations();
  if (!isIgnoring) {
    showWarning('Battery Optimization', 'Please disable battery optimization for this app');
    requestIgnoreBatteryOptimizations();
    return false;
  }
  showInfo('Battery Status', 'Battery optimization is disabled ✓');
  return true;
};