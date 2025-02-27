import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Linking,
  Share,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { NotificationService } from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const DeleteAccountModal = ({ visible, onClose, onConfirm }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.warningIconContainer}>
          <Ionicons name="warning" size={40} color="#FF4444" />
        </View>
        <Text style={styles.modalTitle}>Hesap Silme Onayı</Text>
        <Text style={styles.modalText}>
          Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir.
        </Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteButton]}
            onPress={onConfirm}
          >
            <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

export default function SettingsScreen({ navigation }) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { signOut, user } = useAuth();

  // Bildirim durumunu yükle
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error('Bildirim ayarları yüklenirken hata:', error);
      setIsNotificationsEnabled(false);
    }
  };

  const handleNotificationToggle = async (value) => {
    try {
      if (value) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await NotificationService.setupAllNotifications();
          setIsNotificationsEnabled(true);
          Alert.alert('Başarılı', 'Bildirimler başarıyla etkinleştirildi.');
        } else {
          setIsNotificationsEnabled(false);
          Alert.alert(
            'Bildirim İzni Gerekli',
            'Bildirimleri almak için lütfen uygulama ayarlarından bildirim iznini etkinleştirin.',
            [
              { 
                text: 'Ayarlara Git', 
                onPress: () => Linking.openSettings() 
              },
              { 
                text: 'İptal', 
                style: 'cancel' 
              }
            ]
          );
        }
      } else {
        await NotificationService.cancelAllNotifications();
        setIsNotificationsEnabled(false);
        Alert.alert('Bilgi', 'Bildirimler devre dışı bırakıldı.');
      }
    } catch (error) {
      console.error('Bildirim ayarları değiştirilirken hata:', error);
      Alert.alert('Hata', 'Bildirim ayarları değiştirilirken bir hata oluştu.');
      setIsNotificationsEnabled(false);
    }
  };

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'Motivasyon Cebimde uygulamasını deneyin!',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.navigate('Home');
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Kullanıcının notlarını sil (eğer varsa)
      const { error: notesError } = await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id);

      if (notesError && !notesError.message.includes('does not exist')) {
        throw notesError;
      }

      // Kullanıcı hesabını sil
      const { error: deleteError } = await supabase.rpc('delete_user');
      
      if (deleteError) throw deleteError;

      await signOut();
      navigation.navigate('Home');
    } catch (error) {
      console.error('Hesap silinirken bir hata oluştu:', error);
      // Kullanıcıya hata mesajı göster
      alert('Hesap silme işlemi başarısız oldu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const renderSettingItem = ({ icon, title, value, onPress, isSwitch, color }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingItemLeft}>
        <Ionicons name={icon} size={24} color={color || '#6C63FF'} />
        <Text style={[styles.settingItemText, color && { color }]}>{title}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: '#D1D1D1', true: '#6C63FF' }}
          thumbColor={Platform.OS === 'ios' ? '#FFF' : value ? '#FFF' : '#F4F3F4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel</Text>
        {renderSettingItem({
          icon: 'moon-outline',
          title: 'Karanlık Mod',
          value: isDarkMode,
          onPress: () => setIsDarkMode(!isDarkMode),
          isSwitch: true,
        })}
        {renderSettingItem({
          icon: 'notifications-outline',
          title: 'Bildirimler',
          value: isNotificationsEnabled,
          onPress: handleNotificationToggle,
          isSwitch: true,
        })}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Uygulama</Text>
        {renderSettingItem({
          icon: 'share-social-outline',
          title: 'Uygulamayı Paylaş',
          onPress: shareApp,
        })}
        {renderSettingItem({
          icon: 'star-outline',
          title: 'Uygulamayı Değerlendir',
          onPress: () => Linking.openURL('market://details?id=com.ceptemotivasyon'),
        })}
        {renderSettingItem({
          icon: 'information-circle-outline',
          title: 'Hakkında',
          onPress: () => {},
        })}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => setShowDeleteModal(true)}
        >
          <Ionicons name="trash-outline" size={24} color="#FF4444" />
          <Text style={styles.deleteAccountText}>Hesabı Sil</Text>
        </TouchableOpacity>
      </View>

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />

      <View style={styles.version}>
        <Text style={styles.versionText}>Versiyon 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  version: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 8,
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: 16,
    color: '#FF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
}); 