import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Platform, Linking, Switch } from 'react-native';
import { colors } from '../../constants/colors';
import { loadData, saveData, STORAGE_KEYS } from '../../utils/storage';
import { showSuccess } from '../../utils/toast';

export default function CustomizeScreen() {
  const [permissions, setPermissions] = useState({
    overlay: false,
    accessibility: false,
    usage: false,
  });
  const [settings, setSettings] = useState({
    hapticFeedback: true,
    interventionDelay: 3,
    breathingDuration: 5,
  });

  useEffect(() => {
    checkPermissions();
    loadSettings();
  }, []);

  const checkPermissions = () => {
    // Check overlay permission
    // In real implementation, use native module
    setPermissions({
      overlay: true, // Placeholder
      accessibility: false, // Placeholder
      usage: false, // Placeholder
    });
  };

  const loadSettings = async () => {
    const saved = await loadData(STORAGE_KEYS.USER_SETTINGS);
    if (saved) {
      setSettings(saved);
    }
  };

  const saveSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveData(STORAGE_KEYS.USER_SETTINGS, newSettings);
    showSuccess('Saved', `${key} updated`);
  };

  const openAccessibilitySettings = () => {
    Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS');
  };
  
  const openOverlaySettings = () => {
    Linking.sendIntent('android.settings.action.MANAGE_OVERLAY_PERMISSION');
  };
  
  const openUsageSettings = () => {
    Linking.sendIntent('android.settings.USAGE_ACCESS_SETTINGS');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customize</Text>
          <Text style={styles.headerSubtitle}>Configure your experience</Text>
        </View>

        {/* Permissions Section */}
        <Text style={styles.sectionTitle}>Required Permissions</Text>
        <Text style={styles.sectionSubtitle}>Enable these for full functionality</Text>
        
        <TouchableOpacity style={styles.permissionCard} onPress={openOverlaySettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>📱 Display Over Other Apps</Text>
            <Text style={styles.permissionDescription}>Shows intervention screens when you open apps</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.permissionCard} onPress={openAccessibilitySettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>♿ Accessibility Service</Text>
            <Text style={styles.permissionDescription}>Detects when apps are opened</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.permissionCard} onPress={openUsageSettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>📊 Usage Access</Text>
            <Text style={styles.permissionDescription}>Tracks app usage for accurate statistics</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Haptic Feedback</Text>
          <Switch
            value={settings.hapticFeedback}
            onValueChange={(val) => saveSetting('hapticFeedback', val)}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={settings.hapticFeedback ? colors.primary : colors.textTertiary}
          />
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Intervention Delay (seconds)</Text>
          <View style={styles.settingButtons}>
            {[1, 2, 3, 5].map(delay => (
              <TouchableOpacity
                key={delay}
                style={[styles.settingButton, settings.interventionDelay === delay && styles.settingButtonActive]}
                onPress={() => saveSetting('interventionDelay', delay)}
              >
                <Text style={[styles.settingButtonText, settings.interventionDelay === delay && styles.settingButtonTextActive]}>
                  {delay}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Breathing Duration (seconds)</Text>
          <View style={styles.settingButtons}>
            {[3, 5, 7, 10].map(duration => (
              <TouchableOpacity
                key={duration}
                style={[styles.settingButton, settings.breathingDuration === duration && styles.settingButtonActive]}
                onPress={() => saveSetting('breathingDuration', duration)}
              >
                <Text style={[styles.settingButtonText, settings.breathingDuration === duration && styles.settingButtonTextActive]}>
                  {duration}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tutorial Section */}
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <TouchableOpacity style={styles.helpCard} onPress={openAccessibilitySettings}>
          <Text style={styles.helpTitle}>📖 Step-by-Step Setup Guide</Text>
          <Text style={styles.helpDescription}>Learn how to enable all permissions</Text>
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
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  permissionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionText: {
    flex: 1,
  },
  permissionName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  permissionDescription: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  arrowButton: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
  },
  settingName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  settingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  settingButton: {
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  settingButtonActive: {
    backgroundColor: colors.primary,
  },
  settingButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  settingButtonTextActive: {
    color: colors.textPrimary,
  },
  helpCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  helpDescription: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  bottomPadding: {
    height: 80,
  },
});