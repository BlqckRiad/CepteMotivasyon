import React, { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationService } from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    async function setupApp() {
      // Ekran yönlendirmesi ayarları
      await ScreenOrientation.unlockAsync();
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.ALL
      );

      // Bildirimleri ayarla
      await NotificationService.setupAllNotifications();
    }
    setupApp();
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
