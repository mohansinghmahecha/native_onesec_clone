import React, { useEffect, useState, useCallback } from 'react';
import { Provider } from 'react-redux';
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  AppState,
  NativeModules,
  DeviceEventEmitter,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { store } from './android/app/src/store/store';
import RootNavigator from './android/app/src/navigation/RootNavigator';
import BlockedAppInterventionModal from './android/app/src/screens/Intervention/BlockedAppInterventionModal';
import TimerService from './android/app/src/services/timer/TimerService';
import {
  grantNativeUnlock,
  syncAllToNative,
  clearPendingInterventionNative,
  launchTargetAppNative,
  finishInterventionNative,
  exitTargetAppNative,
} from './android/app/src/utils/nativeSync';
import { getAppByPackage } from './android/app/src/utils/appConfig';
import './android/app/src/services/accessibility/AppUnlockReceiver';

const { PendingAppModule } = NativeModules;

function App() {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasCheckedPermissions, setHasCheckedPermissions] = useState(false);
  const [intervention, setIntervention] = useState({
    visible: false,
    packageName: null,
    appName: null,
  });

  const openIntervention = useCallback((packageName, appName) => {
    if (!packageName) return;
    const app = getAppByPackage(packageName);
    setIntervention({
      visible: true,
      packageName,
      appName: appName || app?.name || 'App',
    });
  }, []);

  const checkPendingIntervention = useCallback(async () => {
    try {
      if (PendingAppModule?.getPendingApp) {
        const pending = await PendingAppModule.getPendingApp();
        if (pending?.packageName && pending?.showIntervention === true) {
          openIntervention(pending.packageName, pending.appName);
        }
      }
    } catch (e) {
      console.warn('PendingAppModule check failed:', e);
    }
  }, [openIntervention]);

  useEffect(() => {
    checkPermissionsOnFirstLaunch();
    syncAllToNative();
  }, []);

  useEffect(() => {
    const subRequired = DeviceEventEmitter.addListener(
      'INTERVENTION_REQUIRED',
      (event) => {
        openIntervention(event?.packageName, event?.appName);
      },
    );

    const subAppState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPendingIntervention();
      }
    });

    checkPendingIntervention();

    return () => {
      subRequired.remove();
      subAppState.remove();
    };
  }, [openIntervention, checkPendingIntervention]);

  const checkPermissionsOnFirstLaunch = async () => {
    const isFirstLaunch = await checkFirstLaunch();
    if (isFirstLaunch) {
      setShowPermissionModal(true);
    }
    setHasCheckedPermissions(true);
  };

  const checkFirstLaunch = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const hasLaunched = await AsyncStorage.getItem('@has_launched');
      if (!hasLaunched) {
        await AsyncStorage.setItem('@has_launched', 'true');
        return true;
      }
      return false;
    } catch (error) {
      return true;
    }
  };

  const checkAllPermissions = async () => {
    setShowPermissionModal(false);
    setTimeout(() => {
      Alert.alert(
        'Enable Permissions',
        'Please enable these permissions for the app to work:\n\n1️⃣ Overlay Permission\n2️⃣ Accessibility Service\n3️⃣ Usage Access\n\nGo to Settings → Apps → IntentionalSpace to enable them.',
        [
          {
            text: 'Open Settings',
            onPress: () =>
              Linking.sendIntent('android.settings.APPLICATION_DETAILS_SETTINGS'),
          },
          { text: 'Later', style: 'cancel' },
        ],
      );
    }, 500);
  };

  const closeIntervention = useCallback(async () => {
    setIntervention({ visible: false, packageName: null, appName: null });
    await clearPendingInterventionNative();
  }, []);

  const exitIntervention = useCallback(async () => {
    const packageName = intervention.packageName;
    setIntervention({ visible: false, packageName: null, appName: null });
    await clearPendingInterventionNative();
    if (packageName) {
      await exitTargetAppNative(packageName);
    }
  }, [intervention]);

  const handleInterventionComplete = useCallback(
    async (minutes) => {
      const { packageName, appName } = intervention;
      if (!packageName) return;

      await grantNativeUnlock(packageName, minutes);
      TimerService.unlockApp(packageName, appName, minutes);
      await clearPendingInterventionNative();
      setIntervention({ visible: false, packageName: null, appName: null });
      await launchTargetAppNative(packageName);
      await finishInterventionNative();
    },
    [intervention],
  );

  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        {hasCheckedPermissions ? <RootNavigator /> : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
        <Toast />

        <BlockedAppInterventionModal
          visible={intervention.visible}
          packageName={intervention.packageName}
          appName={intervention.appName}
          onClose={closeIntervention}
          onExit={exitIntervention}
          onComplete={handleInterventionComplete}
        />

        <Modal
          visible={showPermissionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPermissionModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>🎯 Welcome to IntentionalSpace</Text>
              <Text style={styles.modalSubtitle}>
                Let's set up your digital wellness journey
              </Text>

              <View style={styles.permissionList}>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionIcon}>1️⃣</Text>
                  <Text style={styles.permissionText}>Allow display over other apps</Text>
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionIcon}>2️⃣</Text>
                  <Text style={styles.permissionText}>Enable Accessibility Service</Text>
                </View>
                <View style={styles.permissionItem}>
                  <Text style={styles.permissionIcon}>3️⃣</Text>
                  <Text style={styles.permissionText}>Grant Usage Access</Text>
                </View>
              </View>

              <Text style={styles.modalNote}>
                These permissions help detect when you open apps and show mindful
                interventions.
              </Text>

              <TouchableOpacity style={styles.modalButton} onPress={checkAllPermissions}>
                <Text style={styles.modalButtonText}>Let's Go →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#9b59b6',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  modalTitle: {
    color: '#9b59b6',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionList: {
    marginBottom: 24,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#121212',
    borderRadius: 12,
  },
  permissionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  modalNote: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: '#9b59b6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
