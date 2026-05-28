// D:\CEO\IntentionalSpace\src\screens\Customize\CustomizeScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';

export default function CustomizeScreen() {
  const permissions = [
    { name: 'Accessibility Service', description: 'Detect when apps are opened', status: 'not_granted' },
    { name: 'Usage Access', description: 'Track app usage statistics', status: 'not_granted' },
    { name: 'Overlay Permission', description: 'Show intervention screens', status: 'not_granted' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Customize</Text>
          <Text style={styles.headerSubtitle}>Configure your experience</Text>
        </View>

        {/* Permissions Section */}
        <Text style={styles.sectionTitle}>Required Permissions</Text>
        {permissions.map((perm, index) => (
          <View key={index} style={styles.permissionCard}>
            <View style={styles.permissionText}>
              <Text style={styles.permissionName}>{perm.name}</Text>
              <Text style={styles.permissionDescription}>{perm.description}</Text>
            </View>
            <TouchableOpacity style={styles.permissionButton}>
              <Text style={styles.permissionButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>App Settings</Text>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Intervention Delay</Text>
          <Text style={styles.settingValue}>3 seconds</Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Breathing Exercise Duration</Text>
          <Text style={styles.settingValue}>10 seconds</Text>
        </View>
        
        <View style={styles.settingCard}>
          <Text style={styles.settingName}>Haptic Feedback</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>

        {/* Tutorial Section */}
        <Text style={styles.sectionTitle}>Help & Tutorials</Text>
        <TouchableOpacity style={styles.helpCard}>
          <Text style={styles.helpTitle}>How to enable permissions</Text>
          <Text style={styles.helpDescription}>Step-by-step guide</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.helpCard}>
          <Text style={styles.helpTitle}>Understanding interventions</Text>
          <Text style={styles.helpDescription}>Learn how it works</Text>
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
    paddingTop: 20,
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
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
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
    height: 100,
  },
});