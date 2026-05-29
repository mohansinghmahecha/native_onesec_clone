import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/colors';
import { getTodayOverviewStatsNative } from '../../utils/nativeSync';

function formatMinutes(totalMinutes) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function OverviewScreen() {
  const [stats, setStats] = useState({
    todayScreenMinutes: 0,
    timeSavedMinutes: 0,
    attemptsToday: 0,
    grantedMinutesToday: 0,
    blockedAppUsageMinutes: 0,
    hasUsagePermission: false,
  });
  const [loading, setLoading] = useState(true);

  const loadRealData = useCallback(async () => {
    try {
      const native = await getTodayOverviewStatsNative();
      if (native) {
        setStats({
          todayScreenMinutes: native.todayScreenMinutes ?? 0,
          timeSavedMinutes: native.timeSavedMinutes ?? 0,
          attemptsToday: native.attemptsToday ?? 0,
          grantedMinutesToday: native.grantedMinutesToday ?? 0,
          blockedAppUsageMinutes: native.blockedAppUsageMinutes ?? 0,
          hasUsagePermission: native.hasUsagePermission ?? false,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 10000);
    return () => clearInterval(interval);
  }, [loadRealData]);

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
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerSubtitle}>Your digital wellness at a glance</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Phone active time today</Text>
          <Text style={styles.mainCardValue}>
            {formatMinutes(stats.todayScreenMinutes)}
          </Text>
          {!stats.hasUsagePermission && (
            <Text style={styles.permissionHint}>
              Enable Usage Access in Block → Permissions for accurate screen time
            </Text>
          )}
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Time saved today</Text>
          <Text style={[styles.mainCardValue, styles.savedValue]}>
            {formatMinutes(stats.timeSavedMinutes)}
          </Text>
          <Text style={styles.mainCardSubtext}>
            Granted {formatMinutes(stats.grantedMinutesToday)} − used{' '}
            {formatMinutes(stats.blockedAppUsageMinutes)} on blocked apps
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.attemptsToday}</Text>
            <Text style={styles.statLabel}>Blocked app opens</Text>
            <Text style={styles.statHint}>Times you tried to open a blocked app</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {formatMinutes(stats.blockedAppUsageMinutes)}
            </Text>
            <Text style={styles.statLabel}>Time in blocked apps</Text>
            <Text style={styles.statHint}>Actual usage today</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardWide]}>
            <Text style={styles.statValue}>
              {formatMinutes(stats.grantedMinutesToday)}
            </Text>
            <Text style={styles.statLabel}>Total time you allowed</Text>
            <Text style={styles.statHint}>
              Sum of minutes chosen on intervention screens
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How time saved works</Text>
          <Text style={styles.infoText}>
            Each time you pick a session length (e.g. 5 min), that counts toward
            allowed time. Time saved = allowed − what you actually used in blocked
            apps today.
          </Text>
        </View>

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
    marginVertical: 8,
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
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
  },
  savedValue: {
    color: '#2ecc71',
  },
  mainCardSubtext: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 20,
  },
  permissionHint: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginVertical: 6,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardWide: {
    flex: 1,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  statLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  statHint: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
  },
  infoBox: {
    backgroundColor: '#1a0a2e',
    marginHorizontal: 20,
    marginTop: 16,
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
  bottomPadding: {
    height: 80,
  },
});
