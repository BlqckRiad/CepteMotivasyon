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
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
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
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
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
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: '#fff',
            width: '85%',
            maxWidth: 400,
            padding: 24
          }
        ]}>
          <View style={styles.modalIconContainer}>
            <MaterialCommunityIcons 
              name="logout" 
              size={48} 
              color="#007AFF" 
            />
          </View>
          
          <Text style={[
            styles.modalTitle,
            { 
              color: '#000',
              fontSize: 20,
              fontWeight: '600',
              textAlign: 'center',
              marginTop: 16
            }
          ]}>
            Çıkış Yap
          </Text>
          
          <Text style={[
            styles.modalText,
            { 
              color: '#666',
              fontSize: 16,
              textAlign: 'center',
              marginTop: 8,
              marginBottom: 24
            }
          ]}>
            Uygulamadan çıkış yapmak istediğinize emin misiniz?
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { 
                  backgroundColor: '#f5f5f5',
                  borderColor: '#ddd'
                }
              ]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={[
                styles.modalButtonText,
                { color: '#333' }
              ]}>
                İptal
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                { backgroundColor: '#007AFF' }
              ]}
              onPress={handleLogout}
            >
              <Text style={[
                styles.modalButtonText,
                { color: '#fff' }
              ]}>
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const NotificationSettingsModal = () => (
    <Modal
      visible={showNotificationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowNotificationModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowNotificationModal(false)}
      >
        <View style={[styles.modalContent, { 
          backgroundColor: colors.card,
          width: isTablet() ? '40%' : '80%',
          maxWidth: 320,
          maxHeight: '70%',
        }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="bell-ring"
                size={28}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Bildirim Ayarları
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.subtext }]}>
              Günlük motivasyon bildirimlerini yönetin
            </Text>
          </View>

          <View style={[styles.notificationCard, { backgroundColor: colors.background }]}>
            <View style={styles.notificationSetting}>
              <View style={styles.notificationSettingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialCommunityIcons
                    name="bell"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Günlük Bildirimler
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.subtext }]}>
                    Motivasyon ve görev hatırlatmaları
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                thumbColor={notificationsEnabled ? colors.primary : colors.border}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.notificationTimes}>
              <View style={styles.notificationTime}>
                <View style={[styles.timeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialCommunityIcons
                    name="weather-sunny"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.timeTextContainer}>
                  <Text style={[styles.timeLabel, { color: colors.text }]}>
                    Sabah Bildirimi
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.primary }]}>
                    09:00
                  </Text>
                </View>
              </View>

              <View style={styles.notificationTime}>
                <View style={[styles.timeIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <MaterialCommunityIcons
                    name="weather-night"
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.timeTextContainer}>
                  <Text style={[styles.timeLabel, { color: colors.text }]}>
                    Akşam Bildirimi
                  </Text>
                  <Text style={[styles.timeValue, { color: colors.primary }]}>
                    16:00
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowNotificationModal(false)}
          >
            <Text style={styles.modalButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
            {renderSettingItem('help-circle-outline', 'Yardım', () => navigation.navigate('Help'))}
            {renderSettingItem('information-outline', 'Hakkında', () => navigation.navigate('About'))}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  modalText: {
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default SettingsScreen;