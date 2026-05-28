// D:\CEO\IntentionalSpace\src\screens\Block\BlockScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Switch, TouchableOpacity, Alert, StatusBar, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { saveData, loadData, STORAGE_KEYS } from '../../utils/storage';

export default function BlockScreen() {
  const [strictMode, setStrictMode] = useState(false);
  const [blockedApps, setBlockedApps] = useState({
    instagram: true,
    youtube: true,
    twitter: false,
    reddit: false,
    facebook: false,
  });

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const savedBlockedApps = await loadData(STORAGE_KEYS.BLOCKED_APPS);
      if (savedBlockedApps) {
        setBlockedApps(savedBlockedApps);
      }
      
      const savedSettings = await loadData(STORAGE_KEYS.USER_SETTINGS);
      if (savedSettings && savedSettings.strictMode !== undefined) {
        setStrictMode(savedSettings.strictMode);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const toggleApp = async (app) => {
    const newBlockedApps = { ...blockedApps, [app]: !blockedApps[app] };
    setBlockedApps(newBlockedApps);
    await saveData(STORAGE_KEYS.BLOCKED_APPS, newBlockedApps);
  };

  const toggleStrictMode = async (value) => {
    setStrictMode(value);
    const settings = await loadData(STORAGE_KEYS.USER_SETTINGS) || {};
    settings.strictMode = value;
    await saveData(STORAGE_KEYS.USER_SETTINGS, settings);
  };

  const applyPreset = async (preset) => {
    let newBlockedApps = { ...blockedApps };
    
    switch(preset) {
      case 'social':
        newBlockedApps = {
          instagram: true,
          youtube: false,
          twitter: true,
          reddit: true,
          facebook: true,
        };
        break;
      case 'video':
        newBlockedApps = {
          instagram: false,
          youtube: true,
          twitter: false,
          reddit: false,
          facebook: false,
        };
        break;
      case 'all':
        newBlockedApps = {
          instagram: true,
          youtube: true,
          twitter: true,
          reddit: true,
          facebook: true,
        };
        break;
      default:
        return;
    }
    
    setBlockedApps(newBlockedApps);
    await saveData(STORAGE_KEYS.BLOCKED_APPS, newBlockedApps);
    Alert.alert('Preset Applied', `${preset.toUpperCase()} preset has been applied`);
  };

  const appsList = [
    { key: 'instagram', name: 'Instagram', icon: '📸' },
    { key: 'youtube', name: 'YouTube', icon: '🎬' },
    { key: 'twitter', name: 'X / Twitter', icon: '🐦' },
    { key: 'reddit', name: 'Reddit', icon: '🤖' },
    { key: 'facebook', name: 'Facebook', icon: '👥' },
  ];

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
          <Text style={styles.headerSubtitle}>Choose apps to intervene</Text>
        </View>

        {/* Strict Mode Card */}
        <View style={styles.strictModeCard}>
          <View style={styles.strictModeText}>
            <Text style={styles.strictModeTitle}>Strict Mode</Text>
            <Text style={styles.strictModeSubtitle}>No bypass options, full intervention</Text>
          </View>
          <Switch
            value={strictMode}
            onValueChange={toggleStrictMode}
            trackColor={{ false: colors.border, true: colors.primaryDark }}
            thumbColor={strictMode ? colors.primary : colors.textTertiary}
          />
        </View>

        {/* Blocked Apps List */}
        <Text style={styles.sectionTitle}>Blocked Apps</Text>
        {appsList.map((app) => (
          <TouchableOpacity
            key={app.key}
            style={styles.appItem}
            onPress={() => toggleApp(app.key)}
            activeOpacity={0.7}
          >
            <View style={styles.appInfo}>
              <Text style={styles.appIcon}>{app.icon}</Text>
              <Text style={styles.appName}>{app.name}</Text>
            </View>
            <Switch
              value={blockedApps[app.key]}
              onValueChange={() => toggleApp(app.key)}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={blockedApps[app.key] ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        ))}

        {/* Presets */}
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

        {/* Reset Button */}
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={async () => {
            const defaultApps = {
              instagram: true,
              youtube: true,
              twitter: false,
              reddit: false,
              facebook: false,
            };
            setBlockedApps(defaultApps);
            await saveData(STORAGE_KEYS.BLOCKED_APPS, defaultApps);
            Alert.alert('Reset', 'All settings have been reset to default');
          }}
        >
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
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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