import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../constants/colors';
import PerAppTimeService from '../services/timebank/PerAppTimeService';
import { saveData, STORAGE_KEYS } from '../utils/storage';
import { TRACKED_APPS } from '../utils/appConfig';
import AppTimePickerGrid from '../components/AppTimePickerGrid';

export default function AppTimeSetupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const apps = TRACKED_APPS.map((a) => ({
    key: a.key,
    name: a.name,
    icon: a.icon,
    default: a.defaultDailyMinutes,
  }));

  const currentApp = apps[step];
  const [selectedTime, setSelectedTime] = useState(currentApp?.default || 60);

  const handleNext = async () => {
    await PerAppTimeService.setAppTimeLimit(currentApp.key, selectedTime);

    if (step < apps.length - 1) {
      setStep(step + 1);
      setSelectedTime(apps[step + 1].default);
    } else {
      await saveData(STORAGE_KEYS.TIME_SETUP_COMPLETE, true);
      navigation.replace('Main');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup',
      'You can set time limits for each app later in Settings',
      [
        { text: 'Set Now', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            for (const app of apps) {
              await PerAppTimeService.setAppTimeLimit(app.key, app.default);
            }
            await saveData(STORAGE_KEYS.TIME_SETUP_COMPLETE, true);
            navigation.replace('Main');
          },
        },
      ],
    );
  };

  if (!currentApp) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            App {step + 1} of {apps.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${((step + 1) / apps.length) * 100}%` }]}
            />
          </View>
        </View>

        <View style={styles.appCard}>
          <Text style={styles.appIcon}>{currentApp.icon}</Text>
          <Text style={styles.appName}>{currentApp.name}</Text>
          <Text style={styles.appQuestion}>
            How many minutes per day do you want to spend on {currentApp.name}?
          </Text>
        </View>

        <AppTimePickerGrid selectedTime={selectedTime} onSelectTime={setSelectedTime} />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Why set limits?</Text>
          <Text style={styles.infoText}>
            Once you reach your daily limit for an app, it will be blocked. You can still extend
            in short increments if needed.
          </Text>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {step === apps.length - 1 ? 'Start My Journey →' : 'Next App →'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
    marginBottom: 32,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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
    marginTop: 20,
    marginBottom: 32,
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
  nextButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  skipText: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
