import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import NotificationService from '../lib/NotificationService';
import * as Notifications from 'expo-notifications';

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );

  // Tablet kontrolü
  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height) >= 768;
  };

  // Dinamik stil hesaplayıcılar
  const getDynamicFontSize = (baseSize) => isTablet() ? baseSize * 1.3 : baseSize;
  const getDynamicPadding = (basePadding) => isTablet() ? basePadding * 1.5 : basePadding;
  const getIconSize = () => isTablet() ? (orientation === 'landscape' ? 32 : 28) : 24;

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.navigate('Auth');
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    }
  };

  const handleProfileEdit = () => {
    navigation.navigate('Profile');
  };

  const handlePasswordChange = () => {
    navigation.navigate('ChangePassword');
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const { status } = await NotificationService.requestPermissions();
      
      if (status === 'granted') {
        await NotificationService.scheduleDailyNotifications();
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Bildirim İzni Gerekli',
          'Bildirimleri kullanabilmek için izin vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
      }
    } else {
      await NotificationService.cancelAllNotifications();
      setNotificationsEnabled(false);
    }
  };

  const handlePermissionConfirm = async () => {
    setShowPermissionModal(false);
    const { status } = await NotificationService.requestPermissions();
    
    if (status === 'granted') {
      await NotificationService.scheduleDailyNotifications();
      setNotificationsEnabled(true);
      Alert.alert(
        'Bildirimler Açıldı',
        'Günlük bildirimleriniz başarıyla ayarlandı.',
        [{ text: 'Tamam' }]
      );
    } else {
      Alert.alert(
        'Bildirim İzni Gerekli',
        'Bildirimleri kullanabilmek için izin vermeniz gerekiyor.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Önce user_tasks tablosundaki verileri sil
      const { error: tasksError } = await supabase
        .from('user_tasks')
        .delete()
        .eq('user_id', user.id);

      if (tasksError) {
        console.error('Görevler silinirken hata:', tasksError);
        throw tasksError;
      }

      // Sonra user_badges tablosundaki verileri sil
      const { error: badgesError } = await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      if (badgesError) {
        console.error('Rozetler silinirken hata:', badgesError);
        throw badgesError;
      }

      // En son profiles tablosundaki verileri sil
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profilesError) {
        console.error('Profil silinirken hata:', profilesError);
        throw profilesError;
      }

      // Kullanıcı hesabını sil
      const { error: deleteUserError } = await supabase.rpc('delete_user', {
        user_id: user.id
      });

      if (deleteUserError) {
        console.error('Kullanıcı silinirken hata:', deleteUserError);
        throw deleteUserError;
      }

      // Son olarak kullanıcıyı çıkış yaptır ve Auth ekranına yönlendir
      await signOut();
      navigation.navigate('Auth');
    } catch (error) {
      console.error('Hesap silinirken bir hata oluştu:', error);
      Alert.alert(
        'Hata',
        'Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteAccountModal(false);
    }
  };

  const renderSettingItem = (icon, text, onPress = () => {}) => (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        { 
          borderBottomColor: colors.border,
          paddingVertical: getDynamicPadding(12)
        }
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={getIconSize()}
        color={colors.subtext}
      />
      <Text style={[
        styles.settingText,
        { 
          color: colors.text,
          fontSize: getDynamicFontSize(16),
          marginLeft: getDynamicPadding(12)
        }
      ]}>
        {text}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={getIconSize()}
        color={colors.subtext}
      />
    </TouchableOpacity>
  );

  const ThemeModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showThemeModal}
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: colors.card,
            width: orientation === 'landscape' ? (isTablet() ? '50%' : '70%') : (isTablet() ? '60%' : '85%'),
            padding: getDynamicPadding(24)
          }
        ]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={() => setShowThemeModal(false)}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={getIconSize()} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <View style={[
            styles.modalHeader,
            orientation === 'landscape' && styles.landscapeModalHeader
          ]}>
            <MaterialCommunityIcons 
              name="theme-light-dark" 
              size={getDynamicFontSize(48)} 
              color={colors.primary} 
            />
            
            <Text style={[
              styles.modalTitle, 
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(20),
                marginLeft: orientation === 'landscape' ? getDynamicPadding(16) : 0
              }
            ]}>
              Tema Seçin
            </Text>
          </View>
          
          <View style={[
            styles.themeOptions,
            orientation === 'landscape' && styles.landscapeThemeOptions
          ]}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { 
                  backgroundColor: !isDarkMode ? colors.primary : colors.card,
                  borderColor: colors.border,
                  padding: getDynamicPadding(16),
                  width: orientation === 'landscape' ? '48%' : '100%'
                }
              ]}
              onPress={() => {
                if (isDarkMode) toggleTheme();
                setShowThemeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={getIconSize()}
                color={!isDarkMode ? '#fff' : colors.text}
              />
              <Text style={[
                styles.themeOptionText,
                { 
                  color: !isDarkMode ? '#fff' : colors.text,
                  fontSize: getDynamicFontSize(16),
                  marginLeft: getDynamicPadding(8)
                }
              ]}>
                Açık Tema
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { 
                  backgroundColor: isDarkMode ? colors.primary : colors.card,
                  borderColor: colors.border,
                  padding: getDynamicPadding(16),
                  width: orientation === 'landscape' ? '48%' : '100%'
                }
              ]}
              onPress={() => {
                if (!isDarkMode) toggleTheme();
                setShowThemeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={getIconSize()}
                color={isDarkMode ? '#fff' : colors.text}
              />
              <Text style={[
                styles.themeOptionText,
                { 
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: getDynamicFontSize(16),
                  marginLeft: getDynamicPadding(8)
                }
              ]}>
                Koyu Tema
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const LogoutModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showLogoutModal}
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
        activeOpacity={1}
        onPress={() => setShowLogoutModal(false)}
      >
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: colors.card,
            width: isTablet() ? '40%' : '85%',
            maxWidth: 400,
            borderRadius: 20,
            padding: 24,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }
        ]}>
          <View style={styles.modalHeader}>
            <View style={[styles.iconCircle, { 
              backgroundColor: colors.primary,
              width: 80,
              height: 80,
              borderRadius: 40,
              marginBottom: 20,
              justifyContent: 'center',
              alignItems: 'center',
            }]}>
              <MaterialCommunityIcons
                name="logout"
                size={40}
                color="#fff"
              />
            </View>
            <Text style={[styles.modalTitle, { 
              color: colors.text,
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 12,
            }]}>
              Çıkış Yap
            </Text>
            <Text style={[styles.modalSubtitle, { 
              color: colors.subtext,
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
              marginBottom: 24,
            }]}>
              Hesabınızdan çıkış yapmak istediğinize emin misiniz?
            </Text>
          </View>

          <View style={[styles.modalButtons, {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }]}>
            <TouchableOpacity
              style={[styles.modalButton, { 
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                flex: 1,
                marginRight: 8,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={[styles.modalButtonText, { 
                color: colors.text,
                fontSize: 16,
                fontWeight: '600',
              }]}>
                İptal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { 
                backgroundColor: colors.primary,
                flex: 1,
                marginLeft: 8,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }]}
              onPress={handleLogout}
            >
              <Text style={[styles.modalButtonText, { 
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }]}>
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const NotificationSettingsModal = () => (
    <Modal
      visible={showNotificationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNotificationModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { 
          backgroundColor: colors.card,
          width: '90%',
          maxWidth: 400,
          borderRadius: 16,
          padding: 20,
        }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={32}
              color={colors.primary}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Bildirim Ayarları
            </Text>
          </View>

          {/* Ana Switch */}
          <View style={[styles.mainSwitchContainer, { 
            backgroundColor: colors.background,
            marginVertical: 16,
            padding: 16,
            borderRadius: 12,
          }]}>
            <View style={styles.switchRow}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                Günlük Bildirimler
              </Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={'#FFF'}
                ios_backgroundColor={colors.border}
              />
            </View>
          </View>

          {/* Bildirim Zamanları */}
          <View style={[styles.timesContainer, { 
            backgroundColor: colors.background,
            padding: 16,
            borderRadius: 12,
          }]}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              marginBottom: 16,
            }]}>
              Bildirim Zamanları
            </Text>

            {/* Sabah Bildirimi */}
            <View style={[styles.timeRow, { marginBottom: 16 }]}>
              <View style={styles.timeInfo}>
                <MaterialCommunityIcons
                  name="weather-sunny"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text style={[styles.timeTitle, { color: colors.text }]}>
                    Sabah Bildirimi
                  </Text>
                  <Text style={[styles.timeDescription, { color: colors.subtext }]}>
                    Günlük motivasyon mesajı
                  </Text>
                </View>
              </View>
              <Text style={[styles.timeValue, { color: colors.primary }]}>
                09:00
              </Text>
            </View>

            {/* Akşam Bildirimi */}
            <View style={styles.timeRow}>
              <View style={styles.timeInfo}>
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text style={[styles.timeTitle, { color: colors.text }]}>
                    Akşam Bildirimi
                  </Text>
                  <Text style={[styles.timeDescription, { color: colors.subtext }]}>
                    Görev hatırlatması
                  </Text>
                </View>
              </View>
              <Text style={[styles.timeValue, { color: colors.primary }]}>
                16:00
              </Text>
            </View>
          </View>

          {/* Kapat Butonu */}
          <TouchableOpacity
            style={[styles.closeButton, { 
              backgroundColor: colors.primary,
              marginTop: 20,
            }]}
            onPress={() => setShowNotificationModal(false)}
          >
            <Text style={styles.closeButtonText}>
              Tamam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const DeleteAccountModal = () => (
    <Modal
      visible={showDeleteAccountModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteAccountModal(false)}
    >
      <TouchableOpacity 
        style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.7)' }]}
        activeOpacity={1}
        onPress={() => setShowDeleteAccountModal(false)}
      >
        <View style={[styles.modalContent, { 
          backgroundColor: colors.card,
          width: isTablet() ? '40%' : '85%',
          maxWidth: 400,
          borderRadius: 20,
          padding: 24,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.iconCircle, { 
              backgroundColor: '#FF3B30',
              width: 80,
              height: 80,
              borderRadius: 40,
              marginBottom: 16,
            }]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={40}
                color="#fff"
              />
            </View>
            <Text style={[styles.modalTitle, { 
              color: colors.text,
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 8,
            }]}>
              Hesabı Sil
            </Text>
            <Text style={[styles.modalSubtitle, { 
              color: colors.subtext,
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
            }]}>
              Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.
            </Text>
          </View>

          <View style={[styles.deleteAccountCard, { 
            backgroundColor: colors.background,
            padding: 20,
            borderRadius: 16,
            marginVertical: 24,
            borderWidth: 1,
            borderColor: '#FF3B30',
          }]}>
            <View style={styles.warningRow}>
              <MaterialCommunityIcons
                name="alert"
                size={24}
                color="#FF3B30"
              />
              <Text style={[styles.deleteAccountText, { 
                color: colors.text,
                fontSize: 18,
                marginLeft: 12,
                flex: 1,
              }]}>
                Hesabınızı silmek istediğinizden emin misiniz?
              </Text>
            </View>
            <Text style={[styles.deleteAccountWarning, { 
              color: '#FF3B30',
              fontSize: 16,
              marginTop: 12,
              fontWeight: '600',
            }]}>
              Bu işlem geri alınamaz!
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { 
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                flex: 1,
                marginRight: 8,
              }]}
              onPress={() => setShowDeleteAccountModal(false)}
              disabled={isDeleting}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>İptal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { 
                backgroundColor: '#FF3B30',
                flex: 1,
                marginLeft: 8,
              }]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Hesabı Sil</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const PermissionModal = () => (
    <Modal
      visible={showPermissionModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPermissionModal(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: colors.card,
            borderColor: colors.border,
          }
        ]}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons
              name="bell-ring"
              size={40}
              color={colors.primary}
            />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Bildirimleri Etkinleştir
            </Text>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.modalDescription, { color: colors.text }]}>
              Size daha iyi bir deneyim sunabilmek için bildirim göndermek istiyoruz:
            </Text>
            
            <View style={styles.notificationFeatures}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="sun-clock"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  Sabah 09:00'da günlük motivasyon bildirimi
                </Text>
              </View>
              
              <View style={styles.featureItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.featureText, { color: colors.text }]}>
                  16:00'da görev hatırlatma bildirimi
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => setShowPermissionModal(false)}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                Daha Sonra
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handlePermissionConfirm}
            >
              <Text style={[styles.buttonText, { color: '#FFF' }]}>
                Bildirimleri Aç
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colors.background }
      ]}
    >
      <View style={[
        styles.contentContainer,
        orientation === 'landscape' && {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: '5%',
        }
      ]}>
        {/* Uygulama Ayarları */}
        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            width: isTablet() ? '48%' : '100%',
          }
        ]}>
          <View style={[
            styles.section,
            { backgroundColor: colors.card }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Uygulama Ayarları
            </Text>
            {renderSettingItem('bell-outline', 'Bildirim Ayarları', () => setShowNotificationModal(true))}
            {renderSettingItem('theme-light-dark', 'Tema Ayarları', () => setShowThemeModal(true))}
          </View>
        </View>

        {/* Hesap Ayarları */}
        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            width: isTablet() ? '48%' : '100%',
          }
        ]}>
          <View style={[
            styles.section,
            { backgroundColor: colors.card }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Hesap
            </Text>
            {renderSettingItem('account-edit-outline', 'Profil Düzenle', handleProfileEdit)}
            {renderSettingItem('lock-outline', 'Şifre Değiştir', handlePasswordChange)}
            {renderSettingItem('account-remove', 'Hesabı Sil', () => setShowDeleteAccountModal(true))}
          </View>
        </View>

        {/* Diğer Ayarlar */}
        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            width: '100%',
            marginTop: getDynamicPadding(16)
          }
        ]}>
          <View style={[
            styles.section,
            { backgroundColor: colors.card }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Diğer
            </Text>
            {renderSettingItem('information', 'Hakkında', () => navigation.navigate('About'))}
            {renderSettingItem('help-circle', 'Yardım', () => navigation.navigate('Help'))}
            {renderSettingItem('frequently-asked-questions', 'Sık Sorulan Sorular', () => navigation.navigate('FAQ'))}
          </View>
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            orientation === 'landscape' && {
              width: isTablet() ? '40%' : '50%',
              alignSelf: 'center',
              marginTop: getDynamicPadding(24)
            }
          ]}
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialCommunityIcons
            name="logout"
            size={getIconSize()}
            color="#fff"
          />
          <Text style={[
            styles.logoutButtonText,
            { fontSize: getDynamicFontSize(16) }
          ]}>
            Çıkış Yap
          </Text>
        </TouchableOpacity>
      </View>

      <ThemeModal />
      <LogoutModal />
      <NotificationSettingsModal />
      <DeleteAccountModal />
      <PermissionModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  settingsSection: {
    marginBottom: 16,
  },
  section: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingText: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  mainSwitchContainer: {
    elevation: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  timesContainer: {
    elevation: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  landscapeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  themeOptions: {
    width: '100%',
    marginTop: 24,
  },
  landscapeThemeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontWeight: '500',
  },
  bulletPoints: {
    width: '100%',
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletIcon: {
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  deleteAccountCard: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  deleteAccountText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteAccountWarning: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationFeatures: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default SettingsScreen;