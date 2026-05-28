// D:\CEO\IntentionalSpace\App.js
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { store } from './android/app/src/store/store';
import AppNavigator from './android/app/src/navigation/AppNavigator';
import InterventionHandler from './android/app/src/screens/Intervention/InterventionHandler';
import './android/app/src/services/accessibility/AppUnlockReceiver';
// TimerService is NOT needed here because AppUnlockReceiver handles it

function App() {
  const [showIntervention, setShowIntervention] = useState(false);
  const [currentApp, setCurrentApp] = useState(null);

  // This will be called when user selects time in InterventionHandler
  const handleInterventionComplete = (minutes) => {
    // Close the intervention UI
    setShowIntervention(false);
    setCurrentApp(null);
    // Note: TimerService.unlockApp is NOT called here
    // Because OverlayService already sent broadcast and AppUnlockReceiver handled it
  };

  const handleInterventionClose = () => {
    setShowIntervention(false);
    setCurrentApp(null);
  };

  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <AppNavigator />
        <Toast />
        
        {showIntervention && currentApp && (
          <InterventionHandler
            visible={showIntervention}
            packageName={currentApp.packageName}
            appName={currentApp.name}
            onClose={handleInterventionClose}
            onComplete={handleInterventionComplete}
          />
        )}
      </View>
    </Provider>
  );
}

export default App;