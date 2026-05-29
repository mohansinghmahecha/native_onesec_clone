import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { colors } from '../../constants/colors';
import AppTimePickerGrid from '../../components/AppTimePickerGrid';
import { getAppByPackage, PACKAGE_TO_KEY } from '../../utils/appConfig';
import { loadData, saveData, STORAGE_KEYS } from '../../utils/storage';
import { syncAllToNative } from '../../utils/nativeSync';
import PerAppTimeService from '../../services/timebank/PerAppTimeService';

/**
 * Full-screen intervention using the same time grid as TimeSetupScreen.
 * Shown when user opens a blocked app (e.g. YouTube).
 */
export default function BlockedAppInterventionModal({
  visible,
  packageName,
  appName,
  onClose,
  onExit,
  onComplete,
}) {
  const app = getAppByPackage(packageName);
  const appKey = app?.key || (packageName ? PACKAGE_TO_KEY[packageName] : null);

  const [selectedTime, setSelectedTime] = useState(app?.defaultSessionMinutes ?? 15);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !packageName) return undefined;

    const autoExitTimer = setTimeout(() => {
      if (onExit) {
        onExit();
      } else {
        onClose?.();
      }
    }, 10000);

    return () => clearTimeout(autoExitTimer);
  }, [visible, packageName, onExit, onClose]);

  useEffect(() => {
    if (!visible || !appKey) return;

    const loadDefaults = async () => {
      const sessionLimits = (await loadData(STORAGE_KEYS.APP_SESSION_LIMITS)) || {};
      const dailyLimit = PerAppTimeService.getTimeLimit(appKey);
      const fromSession = sessionLimits[appKey];
      const initial =
        fromSession ||
        (dailyLimit > 0 ? Math.min(dailyLimit, 120) : null) ||
        app?.defaultSessionMinutes ||
        15;
      setSelectedTime(initial);
    };

    loadDefaults();
  }, [visible, appKey, app]);

  const handleConfirm = async () => {
    if (!packageName || saving) return;
    setSaving(true);
    try {
      if (appKey) {
        const sessionLimits =
          (await loadData(STORAGE_KEYS.APP_SESSION_LIMITS)) || {};
        sessionLimits[appKey] = selectedTime;
        await saveData(STORAGE_KEYS.APP_SESSION_LIMITS, sessionLimits);
        await syncAllToNative();
      }
      onComplete?.(selectedTime);
    } finally {
      setSaving(false);
    }
  };

  const displayName = app?.name || appName || 'App';
  const displayIcon = app?.icon || '📱';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Mindful pause</Text>
          </View>

          <View style={styles.appCard}>
            <Text style={styles.appIcon}>{displayIcon}</Text>
            <Text style={styles.appName}>{displayName}</Text>
            <Text style={styles.appQuestion}>
              How many minutes do you want to use {displayName} right now?
            </Text>
          </View>

          <AppTimePickerGrid
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Session limit</Text>
            <Text style={styles.infoText}>
              After {selectedTime} minutes you will be asked again before continuing.
              You can change the default pause timer anytime in the Block tab.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, saving && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={saving}
          >
            <Text style={styles.confirmButtonText}>
              Use {selectedTime} min →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onExit || onClose} style={styles.cancelWrap}>
            <Text style={styles.cancelText}>Exit app — I don't want to use it</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 8,
  },
  headerBadge: {
    alignSelf: 'center',
    backgroundColor: '#1a0a2e',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  headerBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  appCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  appIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  appQuestion: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#1a0a2e',
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 28,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  cancelWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
});
