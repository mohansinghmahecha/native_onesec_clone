// D:\CEO\IntentionalSpace\android\app\src\screens\Intervention\InterventionHandler.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { colors } from '../../constants/colors';
import TimerService from '../../services/timer/TimerService';
import { showSuccess } from '../../utils/toast';

const { width } = Dimensions.get('window');

export default function InterventionHandler({ visible, packageName, appName, onClose, onComplete }) {
  const [step, setStep] = useState('breathing');
  const [countdown, setCountdown] = useState(5);
  const breatheAnimation = new Animated.Value(0);

  useEffect(() => {
    if (visible && step === 'breathing') {
      startBreathingExercise();
    }
  }, [visible]);

  const startBreathingExercise = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnimation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnimation, {
          toValue: 0,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep('timeSelector');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleUnlock = (minutes) => {
    if (onComplete) {
      onComplete(minutes);
    } else {
      TimerService.unlockApp(packageName, appName, minutes);
      showSuccess('Unlocked', `${appName} unlocked for ${minutes} minutes`);
      onClose();
    }
  };

  const breatheScale = breatheAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2]
  });

  const breatheOpacity = breatheAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3]
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          {step === 'breathing' ? (
            <>
              <Text style={styles.appName}>{appName}</Text>
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: breatheScale }],
                    opacity: breatheOpacity
                  }
                ]}
              />
              <Text style={styles.instruction}>Take a deep breath...</Text>
              <Text style={styles.countdown}>{countdown}</Text>
            </>
          ) : (
            <>
              <Text style={styles.question}>How much time do you need?</Text>
              <View style={styles.timeOptions}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => handleUnlock(1)}
                >
                  <Text style={styles.timeText}>1 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => handleUnlock(5)}
                >
                  <Text style={styles.timeText}>5 min</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => handleUnlock(10)}
                >
                  <Text style={styles.timeText}>10 min</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: width * 0.9,
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  appName: {
    color: '#9b59b6',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 32,
  },
  breathingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#9b59b6',
    marginBottom: 32,
  },
  instruction: {
    color: '#A0A0A0',
    fontSize: 18,
    marginBottom: 16,
  },
  countdown: {
    color: '#9b59b6',
    fontSize: 48,
    fontWeight: 'bold',
  },
  question: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  timeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  timeButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    minWidth: 80,
    alignItems: 'center',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    color: '#666666',
    fontSize: 14,
  },
});