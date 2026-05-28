import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { colors } from '../../constants/colors';
import { loadData, STORAGE_KEYS } from '../../utils/storage';

export default function OverviewScreen() {
  const [stats, setStats] = useState({
    timeSaved: 0,
    attemptsPrevented: 0,
    currentStreak: 0,
    longestStreak: 0,
    todayAttempts: 0,
    totalBlocks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRealData = async () => {
    try {
      // Load analytics from storage
      const analytics = await loadData(STORAGE_KEYS.ANALYTICS_DATA);
      if (analytics) {
        setStats({
          timeSaved: analytics.totalTimeSaved || 0,
          attemptsPrevented: analytics.totalAttempts || 0,
          currentStreak: analytics.currentStreak || 0,
          longestStreak: analytics.longestStreak || 0,
          todayAttempts: analytics.todayAttempts || 0,
          totalBlocks: analytics.totalBlocks || 0,
        });
      }
      
      // Load recent activity
      const activity = await loadData(STORAGE_KEYS.RECENT_ACTIVITY);
      if (activity && Array.isArray(activity)) {
        setRecentActivity(activity.slice(0, 5)); // Show last 5 activities
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
            {stats.timeSaved > 0 ? `That's ${Math.floor(stats.timeSaved / 5)} mindful moments` : 'Start by blocking apps'}
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

        {/* Today's Activity */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          {stats.todayAttempts === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No attempts yet today</Text>
              <Text style={styles.emptyStateSubtext}>Stay mindful! 🌱</Text>
            </View>
          ) : (
            <View style={styles.activityItem}>
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>
                {stats.todayAttempts} intervention{stats.todayAttempts !== 1 ? 's' : ''} triggered
              </Text>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <Text style={styles.activityText}>{activity.message}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
        )}
        
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  bottomPadding: {
    height: 80,
  },
});