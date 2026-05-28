// D:\CEO\IntentionalSpace\src\navigation\AppNavigator.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { colors } from '../constants/colors';

// Import screens
import OverviewScreen from '../screens/Overview/OverviewScreen';
import BlockScreen from '../screens/Block/BlockScreen';
import CustomizeScreen from '../screens/Customize/CustomizeScreen';

const Tab = createBottomTabNavigator();

// Custom tab bar icon using emojis (no vector icons needed)
const TabIcon = ({ focused, label, icon }) => (
  <View style={styles.iconContainer}>
    <Text style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}>{icon}</Text>
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

export default function AppNavigator() {
  return (
    <View style={styles.safeArea}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: true,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textTertiary,
            tabBarLabelStyle: styles.tabBarLabel,
            tabBarIcon: ({ focused }) => {
              let iconName = '';
              if (route.name === 'Overview') {
                iconName = '📊';
              } else if (route.name === 'Block') {
                iconName = '🛡️';
              } else if (route.name === 'Customize') {
                iconName = '⚙️';
              }
              return <TabIcon focused={focused} label={route.name} icon={iconName} />;
            },
          })}
        >
          <Tab.Screen name="Overview" component={OverviewScreen} />
          <Tab.Screen name="Block" component={BlockScreen} />
          <Tab.Screen name="Customize" component={CustomizeScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  tabBar: {
    backgroundColor: colors.backgroundCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: colors.primary,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
});