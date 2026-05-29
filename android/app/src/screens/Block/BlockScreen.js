import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  TextInput,
  NativeModules,
} from 'react-native';
import { colors } from '../../constants/colors';
import { saveData, loadData, STORAGE_KEYS } from '../../utils/storage';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import {
  TRACKED_APPS,
  defaultBlockedAppsState,
  defaultSessionLimits,
} from '../../utils/appConfig';
import { syncAllToNative } from '../../utils/nativeSync';
import PerAppTimeService from '../../services/timebank/PerAppTimeService';

const { IntentionalSpaceModule } = NativeModules;

export default function BlockScreen() {
  const [strictMode, setStrictMode] = useState(false);
  const [blockedApps, setBlockedApps] = useState(defaultBlockedAppsState());
  const [sessionLimits, setSessionLimits] = useState(defaultSessionLimits());
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [permStatus, setPermStatus] = useState({
    accessibility: false,
    overlay: false,
    usageAccess: false,
  });

  useEffect(() => {
    loadSavedData();
    refreshPermissionStatus();
  }, []);

  const refreshPermissionStatus = async () => {
    if (Platform.OS !== 'android' || !IntentionalSpaceModule?.getInterventionStatus) return;
    try {
      const status = await IntentionalSpaceModule.getInterventionStatus();
      setPermStatus(status);
    } catch (e) {
      console.warn('Permission status:', e);
    }
  };

  const loadSavedData = async () => {
    try {
      const savedBlockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
      if (savedBlockedApps) {
        setBlockedApps(savedBlockedApps);
      }

      const savedSession = await loadData(STORAGE_KEYS.APP_SESSION_LIMITS);
      if (savedSession) {
        setSessionLimits({ ...defaultSessionLimits(), ...savedSession });
      }

      const savedSettings = await loadData(STORAGE_KEYS.USER_SETTINGS);
      if (savedSettings && savedSettings.strictMode !== undefined) {
        setStrictMode(savedSettings.strictMode);
      }

      await syncAllToNative();
    } catch (error) {
      showError('Load Error', error.message);
    }
  };

  const persistSettings = async (newBlocked, newSessions) => {
    await saveData(STORAGE_KEYS.BLOCKED_APPS, newBlocked);
    await saveData(STORAGE_KEYS.APP_SESSION_LIMITS, newSessions);
    for (const app of TRACKED_APPS) {
      const minutes = newSessions[app.key];
      if (minutes > 0 && newBlocked[app.key]) {
        PerAppTimeService.timeLimits[app.key] = minutes;
      }
    }
    await PerAppTimeService.saveAllData();
    await syncAllToNative();
  };

  const toggleApp = async (appKey) => {
    const newBlockedApps = { ...blockedApps, [appKey]: !blockedApps[appKey] };
    setBlockedApps(newBlockedApps);
    await persistSettings(newBlockedApps, sessionLimits);

    const status = newBlockedApps[appKey] ? 'blocked' : 'unblocked';
    showSuccess(appKey.toUpperCase(), `App ${status}`);
  };

  const startEditSession = (appKey) => {
    setEditingKey(appKey);
    setEditValue(String(sessionLimits[appKey] || 15));
  };

  const saveSessionMinutes = async (appKey) => {
    const minutes = parseInt(editValue, 10);
    if (isNaN(minutes) || minutes < 1 || minutes > 480) {
      showError('Invalid', 'Enter between 1 and 480 minutes');
      return;
    }
    const newSessions = { ...sessionLimits, [appKey]: minutes };
    setSessionLimits(newSessions);
    setEditingKey(null);
    await persistSettings(blockedApps, newSessions);
    const app = TRACKED_APPS.find((a) => a.key === appKey);
    showSuccess(
      'Session Updated',
      `${app?.name || appKey}: pause after ${minutes} min of use`,
    );
  };

  const toggleStrictMode = async (value) => {
    setStrictMode(value);
    const settings = (await loadData(STORAGE_KEYS.USER_SETTINGS)) || {};
    settings.strictMode = value;
    await saveData(STORAGE_KEYS.USER_SETTINGS, settings);
    showInfo('Strict Mode', value ? 'Enabled' : 'Disabled');
  };

  const applyPreset = async (preset) => {
    let newBlockedApps = { ...blockedApps };

    switch (preset) {
      case 'social':
        newBlockedApps = {
          instagram: true,
          youtube: false,
          twitter: true,
          reddit: true,
          facebook: true,
        };
        showSuccess('Preset Applied', 'Social Media preset activated');
        break;
      case 'video':
        newBlockedApps = {
          instagram: false,
          youtube: true,
          twitter: false,
          reddit: false,
          facebook: false,
        };
        showSuccess('Preset Applied', 'Video Apps preset activated');
        break;
      case 'all':
        newBlockedApps = {
          instagram: true,
          youtube: true,
          twitter: true,
          reddit: true,
          facebook: true,
        };
        showSuccess('Preset Applied', 'All Apps blocked');
        break;
      default:
        return;
    }

    setBlockedApps(newBlockedApps);
    await persistSettings(newBlockedApps, sessionLimits);
  };

  const resetToDefault = async () => {
    const defaultApps = defaultBlockedAppsState();
    const defaultSessions = defaultSessionLimits();
    setBlockedApps(defaultApps);
    setSessionLimits(defaultSessions);
    await persistSettings(defaultApps, defaultSessions);
    showSuccess('Reset', 'All settings reset to default');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Block Distractions</Text>
          <Text style={styles.headerSubtitle}>
            Block apps and set max minutes per day (needs Usage Access for today's screen time)
          </Text>
        </View>

        {Platform.OS === 'android' &&
          (!permStatus.accessibility || !permStatus.overlay) && (
          <View style={styles.permCard}>
            <Text style={styles.permTitle}>Required for blocking to work</Text>
            {!permStatus.accessibility && (
              <TouchableOpacity
                style={styles.permRow}
                onPress={() => {
                  IntentionalSpaceModule?.openAccessibilitySettings?.();
                  setTimeout(refreshPermissionStatus, 1500);
                }}
              >
                <Text style={styles.permBad}>✗</Text>
                <Text style={styles.permText}>Enable Accessibility Service</Text>
              </TouchableOpacity>
            )}
            {!permStatus.overlay && (
              <TouchableOpacity
                style={styles.permRow}
                onPress={() => {
                  IntentionalSpaceModule?.openOverlayPermissionSettings?.();
                  setTimeout(refreshPermissionStatus, 1500);
                }}
              >
                <Text style={styles.permBad}>✗</Text>
                <Text style={styles.permText}>Allow display over other apps</Text>
              </TouchableOpacity>
            )}
            {!permStatus.usageAccess && (
              <TouchableOpacity
                style={styles.permRow}
                onPress={() => {
                  IntentionalSpaceModule?.openUsageAccessSettings?.();
                  setTimeout(refreshPermissionStatus, 1500);
                }}
              >
                <Text style={styles.permWarn}>!</Text>
                <Text style={styles.permText}>Usage Access (for daily time limit)</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.strictModeCard}>
          <View style={styles.strictModeText}>
            <Text style={styles.strictModeTitle}>Strict Mode</Text>
            <Text style={styles.strictModeSubtitle}>
              No bypass options, full intervention
            </Text>
          </View>
          <Switch
            value={strictMode}
            onValueChange={toggleStrictMode}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={strictMode ? colors.primary : colors.textTertiary}
          />
        </View>

        <Text style={styles.sectionTitle}>Blocked Apps</Text>
        {TRACKED_APPS.map((app) => (
          <View key={app.key} style={styles.appItem}>
            <View style={styles.appRow}>
              <View style={styles.appInfo}>
                <Text style={styles.appIcon}>{app.icon}</Text>
                <View>
                  <Text style={styles.appName}>{app.name}</Text>
                  {blockedApps[app.key] && (
                    <Text style={styles.sessionHint}>
                      Max {sessionLimits[app.key] ?? app.defaultSessionMinutes} min/day · unlock session length
                    </Text>
                  )}
                </View>
              </View>
              <Switch
                value={!!blockedApps[app.key]}
                onValueChange={() => toggleApp(app.key)}
                trackColor={{ false: colors.border, true: colors.primaryDark }}
                thumbColor={blockedApps[app.key] ? colors.primary : colors.textTertiary}
              />
            </View>

            {blockedApps[app.key] && (
              <View style={styles.sessionEditor}>
                {editingKey === app.key ? (
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.sessionInput}
                      value={editValue}
                      onChangeText={setEditValue}
                      keyboardType="number-pad"
                      placeholder="Minutes"
                      placeholderTextColor={colors.textTertiary}
                    />
                    <TouchableOpacity
                      style={styles.saveBtn}
                      onPress={() => saveSessionMinutes(app.key)}
                    >
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingKey(null)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => startEditSession(app.key)}>
                    <Text style={styles.editLink}>
                      ✏️ Edit daily cap ({sessionLimits[app.key] ?? app.defaultSessionMinutes} min)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <View style={styles.presetsContainer}>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => applyPreset('social')}
          >
            <Text style={styles.presetText}>Social Media</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => applyPreset('video')}
          >
            <Text style={styles.presetText}>Video Apps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => applyPreset('all')}
          >
            <Text style={styles.presetText}>All Apps</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetToDefault}>
          <Text style={styles.resetButtonText}>Reset to Default</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  permCard: {
    backgroundColor: '#2a1010',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  permTitle: {
    color: colors.error,
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permBad: {
    color: colors.error,
    fontSize: 16,
    marginRight: 10,
    width: 20,
  },
  permWarn: {
    color: '#e67e22',
    fontSize: 16,
    marginRight: 10,
    width: 20,
  },
  permText: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  strictModeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  strictModeText: {
    flex: 1,
  },
  strictModeTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  strictModeSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  appItem: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  sessionHint: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 4,
  },
  sessionEditor: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionInput: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cancelText: {
    color: colors.textTertiary,
    marginLeft: 4,
  },
  editLink: {
    color: colors.primary,
    fontSize: 13,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginTop: 8,
  },
  presetButton: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: colors.error,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 80,
  },
});
