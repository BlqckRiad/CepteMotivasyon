import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

// Bildirim davranışını ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  static async registerForPushNotificationsAsync() {
    try {
      let token;

      if (!Device.isDevice) {
        Alert.alert('Uyarı', 'Bildirimler fiziksel cihazda test edilmelidir.');
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6C63FF',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Uyarı', 'Bildirim izni alınamadı. Ayarlardan manuel olarak izin vermeniz gerekebilir.');
        return null;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Bildirim izni alınırken hata:', error);
      Alert.alert('Hata', 'Bildirim ayarları yapılandırılırken bir hata oluştu.');
      return null;
    }
  }

  // Günlük sabah bildirimi planla
  static async scheduleMorningNotification() {
    try {
      // Önce varolan bildirimi temizle
      await this.cancelScheduledNotification('morning');

      // Rastgele bir söz al
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*')
        .limit(1)
        .single();

      if (error || !quote) {
        console.error('Quote fetch error:', error);
        quote = {
          gununsozu: 'Yeni bir güne başlamak için harika bir zaman!',
          sozunsahibi: 'Cepte Motivasyon'
        };
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Günaydın!',
          body: quote.gununsozu,
          data: { type: 'morning' },
        },
        trigger: {
          hour: 9,
          minute: 0,
          repeats: true,
        },
        identifier: 'morning',
      });

      return true;
    } catch (error) {
      console.error('Sabah bildirimi planlanırken hata:', error);
      return false;
    }
  }

  // Öğlen görev hatırlatma bildirimi
  static async scheduleTaskReminder() {
    try {
      // Önce varolan bildirimi temizle
      await this.cancelScheduledNotification('taskReminder');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📝 Günlük Görevler',
          body: 'Bugünün görevlerini tamamlamayı unutma!',
          data: { type: 'taskReminder' },
        },
        trigger: {
          hour: 12,
          minute: 0,
          repeats: true,
        },
        identifier: 'taskReminder',
      });

      return true;
    } catch (error) {
      console.error('Görev hatırlatma bildirimi planlanırken hata:', error);
      return false;
    }
  }

  // Akşam motivasyon bildirimi
  static async scheduleEveningMotivation() {
    try {
      // Önce varolan bildirimi temizle
      await this.cancelScheduledNotification('evening');

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌟 Günün Nasıl Geçti?',
          body: 'Tamamladığın görevler için kendini tebrik etmeyi unutma!',
          data: { type: 'evening' },
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
        identifier: 'evening',
      });

      return true;
    } catch (error) {
      console.error('Akşam bildirimi planlanırken hata:', error);
      return false;
    }
  }

  // Planlanmış bildirimi iptal et
  static async cancelScheduledNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Bildirim iptal edilirken hata:', error);
    }
  }

  // Tüm bildirimleri ayarla
  static async setupAllNotifications() {
    await this.registerForPushNotificationsAsync();
    await this.scheduleMorningNotification();
    await this.scheduleTaskReminder();
    await this.scheduleEveningMotivation();
  }

  // Tüm bildirimleri iptal et
  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
} 