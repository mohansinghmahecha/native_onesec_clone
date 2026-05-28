// D:\CEO\IntentionalSpace\src\screens\Overview\OverviewScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { colors } from '../../constants/colors';

export default function OverviewScreen() {
  // Mock data - will be replaced with real data later
  const stats = {
    timeSaved: 127,
    attemptsPrevented: 43,
    currentStreak: 5,
    longestStreak: 12,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>IntentionalSpace</Text>
          <Text style={styles.headerSubtitle}>Your digital wellness journey</Text>
        </View>

        {/* Main Stats Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Time Saved Today</Text>
          <Text style={styles.mainCardValue}>{stats.timeSaved} min</Text>
          <View style={styles.mainCardDivider} />
          <Text style={styles.mainCardSubtext}>
            That's {Math.floor(stats.timeSaved / 5)} mindful moments
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.attemptsPrevented}</Text>
            <Text style={styles.statLabel}>Attempts Prevented</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Saved 5 min from Instagram</Text>
            <Text style={styles.activityTime}>2 min ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Completed breathing exercise</Text>
            <Text style={styles.activityTime}>1 hour ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>Blocked YouTube opening</Text>
            <Text style={styles.activityTime}>3 hours ago</Text>
          </View>
        </View>
        
        {/* Extra padding for bottom tab bar */}
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
  mainCard: {
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainCardLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  mainCardValue: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  mainCardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  mainCardSubtext: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  activityTime: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  bottomPadding: {
    height: 80, // Extra space for bottom tab bar
  },
});