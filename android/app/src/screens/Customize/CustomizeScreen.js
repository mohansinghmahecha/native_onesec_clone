import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, StatusBar, Platform, Linking } from 'react-native';
import { colors } from '../../constants/colors';

export default function CustomizeScreen() {
  
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
        
        <TouchableOpacity style={styles.permissionCard} onPress={openAccessibilitySettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>Accessibility Service</Text>
            <Text style={styles.permissionDescription}>Detect when apps are opened</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.permissionCard} onPress={openUsageSettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>Usage Access</Text>
            <Text style={styles.permissionDescription}>Track app usage statistics</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.permissionCard} onPress={openOverlaySettings}>
          <View style={styles.permissionText}>
            <Text style={styles.permissionName}>Overlay Permission</Text>
            <Text style={styles.permissionDescription}>Show intervention screens</Text>
          </View>
          <Text style={styles.arrowButton}>→</Text>
        </TouchableOpacity>

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Intervention Delay</Text>
          <Text style={styles.settingValue}>3 seconds</Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Breathing Duration</Text>
          <Text style={styles.settingValue}>5 seconds</Text>
        </View>

        {/* Tutorial */}
        <Text style={styles.sectionTitle}>Need Help?</Text>
        <TouchableOpacity style={styles.helpCard}>
          <Text style={styles.helpTitle}>📖 How to enable permissions</Text>
          <Text style={styles.helpDescription}>Step-by-step guide to enable all permissions</Text>
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
  },
  settingName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  settingValue: {
    color: colors.primary,
    fontSize: 14,
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