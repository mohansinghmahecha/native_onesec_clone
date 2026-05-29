import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { loadData, STORAGE_KEYS } from '../utils/storage';
import { colors } from '../constants/colors';
import AppNavigator from './AppNavigator';
import TimeSetupScreen from '../screens/TimeSetupScreen';

export default function RootNavigator() {
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(true);

  useEffect(() => {
    (async () => {
      const done = await loadData(STORAGE_KEYS.TIME_SETUP_COMPLETE);
      setSetupComplete(!!done);
      setLoading(false);
    })();
  }, []);

  const setupNavigation = {
    replace: (screen) => {
      if (screen === 'Main') {
        setSetupComplete(true);
      }
    },
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!setupComplete ? (
        <TimeSetupScreen navigation={setupNavigation} />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
