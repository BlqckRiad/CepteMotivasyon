import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim izinlerini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  static async requestPermissions() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return { status: finalStatus };
  }

  static async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  static async scheduleDailyNotifications() {
    try {
      // Önceki bildirimleri temizle
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Sabah bildirimi (09:00)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Günaydın! 🌞",
          body: "Bugünün görevlerini yapmayı unutma! Başarıya bir adım daha yaklaş.",
          data: { type: 'morning' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });

      // Öğleden sonra bildirimi (16:00)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Görev Kontrolü 🎯",
          body: "Bugünün görevlerini tamamladın mı? Başarıya giden yolda ilerlemeye devam et!",
          data: { type: 'afternoon' },
        },
        trigger: {
          hour: 16,
          minute: 0,
          repeats: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      return false;
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Error canceling notifications:', error);
      return false;
    }
  }
}

export default NotificationService; 