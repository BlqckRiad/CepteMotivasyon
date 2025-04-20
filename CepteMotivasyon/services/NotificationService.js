import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setupNotifications = async () => {
  const isScheduled = await AsyncStorage.getItem('notificationsScheduled');
  if (isScheduled) return;

  // Sabah 9:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Günaydın! 🌞',
      body: 'Bugün görevlerini tamamlamayı unutma!',
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });

  // Öğleden sonra 15:00
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hatırlatma! ⏳',
      body: 'Günün nasıl gidiyor? Görevlerini tamamladın mı?',
    },
    trigger: {
      hour: 15,
      minute: 0,
      repeats: true,
    },
  });

  await AsyncStorage.setItem('notificationsScheduled', 'true');
};
