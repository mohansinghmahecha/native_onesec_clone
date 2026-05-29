import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  Platform, TouchableOpacity, TextInput, Switch, ActivityIndicator, Image
} from 'react-native';
import { colors } from '../constants/colors';
import InstalledAppsService from '../services/apps/InstalledAppsService';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';
import { showSuccess } from '../utils/toast';

export default function AllAppsScreen({ navigation }) {
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [blockedApps, setBlockedApps] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSystemApps, setShowSystemApps] = useState(false);

  useEffect(() => {
    loadAppsAndSettings();
  }, []);

  const loadAppsAndSettings = async () => {
    try {
      setLoading(true);
      // Get installed apps
      const installedApps = await InstalledAppsService.getInstalledApps();
      setApps(installedApps);
      setFilteredApps(installedApps);

      // Load blocked apps
      const savedBlocked = await loadData(STORAGE_KEYS.BLOCKED_APPS);
      if (savedBlocked) {
        setBlockedApps(savedBlocked);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApp = async (packageName, appName) => {
    const newBlockedApps = { ...blockedApps, [packageName]: !blockedApps[packageName] };
    setBlockedApps(newBlockedApps);
    await saveData(STORAGE_KEYS.BLOCKED_APPS, newBlockedApps);
    
    const status = newBlockedApps[packageName] ? 'blocked' : 'unblocked';
    showSuccess(appName, `App ${status}`);
    
    // Refresh filtered list
    filterApps();
  };

  const filterApps = () => {
    let filtered = [...apps];
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredApps(filtered);
  };

  useEffect(() => {
    filterApps();
  }, [searchQuery, apps, blockedApps]);

  const blockAllSocial = () => {
    const socialApps = ['instagram', 'youtube', 'twitter', 'facebook', 'snapchat', 'tiktok'];
    const newBlockedApps = { ...blockedApps };
    
    filteredApps.forEach(app => {
      const isSocial = socialApps.some(social => 
        app.appName.toLowerCase().includes(social) || 
        app.packageName.toLowerCase().includes(social)
      );
      if (isSocial) {
        newBlockedApps[app.packageName] = true;
      }
    });
    
    setBlockedApps(newBlockedApps);
    saveData(STORAGE_KEYS.BLOCKED_APPS, newBlockedApps);
    showSuccess('Blocked', 'Social media apps blocked');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your apps...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Apps</Text>
        <Text style={styles.headerSubtitle}>Select which apps to block ({apps.length} apps)</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={blockAllSocial}>
          <Text style={styles.quickButtonText}>Block Social Media</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Apps List */}
      <ScrollView style={styles.appsList}>
        {filteredApps.map((app) => (
          <TouchableOpacity
            key={app.packageName}
            style={styles.appItem}
            onPress={() => toggleApp(app.packageName, app.appName)}
            activeOpacity={0.7}
          >
            <View style={styles.appInfo}>
              {app.icon ? (
                <Image 
                  source={{ uri: `data:image/png;base64,${app.icon}` }} 
                  style={styles.appIcon}
                />
              ) : (
                <View style={styles.appIconPlaceholder}>
                  <Text style={styles.appIconText}>📱</Text>
                </View>
              )}
              <View style={styles.appDetails}>
                <Text style={styles.appName}>{app.appName}</Text>
                <Text style={styles.appPackage}>{app.packageName}</Text>
              </View>
            </View>
            <Switch
              value={blockedApps[app.packageName] === true}
              onValueChange={() => toggleApp(app.packageName, app.appName)}
              trackColor={{ false: colors.border, true: colors.primaryDark }}
              thumbColor={blockedApps[app.packageName] ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
        
        {filteredApps.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No apps found</Text>
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
  header: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: 12,
    fontSize: 16,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickButton: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
  appsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  appItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 20,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  appPackage: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  bottomPadding: {
    height: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
  },
});