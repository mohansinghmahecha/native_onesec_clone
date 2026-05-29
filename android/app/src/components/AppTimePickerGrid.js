import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../constants/colors';

export const DEFAULT_TIME_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export default function AppTimePickerGrid({
  selectedTime,
  onSelectTime,
  timeOptions = DEFAULT_TIME_OPTIONS,
  showCustomButton = true,
  customMin = 5,
  customMax = 480,
}) {
  const handleCustomTime = () => {
    Alert.prompt(
      'Custom Time',
      `Enter minutes (${customMin}-${customMax})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: (value) => {
            const minutes = parseInt(value, 10);
            if (!isNaN(minutes) && minutes >= customMin && minutes <= customMax) {
              onSelectTime(minutes);
            } else {
              Alert.alert('Invalid', `Please enter between ${customMin}-${customMax} minutes`);
            }
          },
        },
      ],
      'plain-text',
      String(selectedTime),
    );
  };

  return (
    <View>
      <View style={styles.timeGrid}>
        {timeOptions.map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[styles.timeCard, selectedTime === minutes && styles.timeCardActive]}
            onPress={() => onSelectTime(minutes)}
          >
            <Text style={[styles.timeLabel, selectedTime === minutes && styles.timeLabelActive]}>
              {minutes}
            </Text>
            <Text style={styles.timeUnit}>min</Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCustomButton && (
        <TouchableOpacity style={styles.customButton} onPress={handleCustomTime}>
          <Text style={styles.customButtonText}>🎯 Set Custom Time</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  timeCard: {
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 70,
  },
  timeCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#1a0a2e',
  },
  timeLabel: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  timeLabelActive: {
    color: colors.primary,
  },
  timeUnit: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  customButton: {
    marginHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  customButtonText: {
    color: colors.primary,
    fontSize: 14,
  },
});
