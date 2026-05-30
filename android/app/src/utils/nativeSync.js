import { NativeModules, Platform } from 'react-native';
import { loadData, STORAGE_KEYS } from './storage';

const { IntentionalSpaceModule, PendingAppModule } = NativeModules;

export async function syncBlockedAppsToNative() {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.syncBlockedApps) {
    return false;
  }
  const blockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
  if (!blockedApps) return false;
  await IntentionalSpaceModule.syncBlockedApps(JSON.stringify(blockedApps));
  return true;
}

export async function syncSessionLimitsToNative() {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.syncSessionLimits) {
    return false;
  }
  const sessionLimits = await loadData(STORAGE_KEYS.APP_SESSION_LIMITS);
  if (!sessionLimits) return false;
  await IntentionalSpaceModule.syncSessionLimits(JSON.stringify(sessionLimits));
  return true;
}

export async function syncAppTimeDataToNative() {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.syncAppTimeData) {
    return false;
  }
  const limits = await loadData(STORAGE_KEYS.APP_TIME_LIMITS);
  const used = await loadData(STORAGE_KEYS.APP_USED_TIME);
  await IntentionalSpaceModule.syncAppTimeData(
    JSON.stringify({
      limits: limits || {},
      used: used || {},
    }),
  );
  return true;
}

export async function grantNativeUnlock(packageName, minutes) {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.grantUnlock) {
    return false;
  }
  await IntentionalSpaceModule.grantUnlock(packageName, minutes);
  return true;
}

export async function exitTargetAppNative(packageName) {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.exitTargetApp) {
    return false;
  }
  await IntentionalSpaceModule.exitTargetApp(packageName);
  return true;
}

export async function launchTargetAppNative(packageName) {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.launchTargetApp) {
    return false;
  }
  await IntentionalSpaceModule.launchTargetApp(packageName);
  return true;
}

export async function finishInterventionNative() {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.finishIntervention) {
    return false;
  }
  await IntentionalSpaceModule.finishIntervention();
  return true;
}

export async function getTodayOverviewStatsNative() {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.getTodayOverviewStats) {
    return null;
  }
  return IntentionalSpaceModule.getTodayOverviewStats();
}

export async function clearNativeUnlock(packageName) {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.clearUnlock) {
    return false;
  }
  await IntentionalSpaceModule.clearUnlock(packageName);
  return true;
}

/** Session timer ended — lock app and show block modal when user is in / opens the app. */
export async function notifyNativeUnlockExpired(packageName) {
  if (Platform.OS !== 'android' || !IntentionalSpaceModule?.notifyUnlockExpired) {
    return false;
  }
  await IntentionalSpaceModule.notifyUnlockExpired(packageName);
  return true;
}

export async function clearPendingInterventionNative() {
  if (Platform.OS !== 'android' || !PendingAppModule?.clearPendingIntervention) {
    return false;
  }
  await PendingAppModule.clearPendingIntervention();
  return true;
}

export async function syncAllToNative() {
  await syncBlockedAppsToNative();
  await syncSessionLimitsToNative();
  await syncAppTimeDataToNative();
}
