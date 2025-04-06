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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
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
            backgroundColor: colors.card,
            width: isTablet() ? '50%' : '85%',
            padding: getDynamicPadding(24)
          }
        ]}>
          <MaterialCommunityIcons 
            name="logout-alert" 
            size={getDynamicFontSize(48)} 
            color="#f44336" 
          />
          <Text style={[
            styles.modalTitle,
            { 
              color: colors.text,
              fontSize: getDynamicFontSize(20)
            }
          ]}>
            Çıkış Yap
          </Text>
          <Text style={[
            styles.modalText,
            { 
              color: colors.subtext,
              fontSize: getDynamicFontSize(16)
            }
          ]}>
            Hesabınızdan çıkış yapmak istediğinize emin misiniz?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cancelButton,
                { padding: getDynamicPadding(12) }
              ]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={[
                styles.cancelButtonText,
                { fontSize: getDynamicFontSize(16) }
              ]}>
                Vazgeç
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.logoutModalButton,
                { padding: getDynamicPadding(12) }
              ]}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons 
                name="logout" 
                size={getIconSize()} 
                color="#fff" 
              />
              <Text style={[
                styles.logoutModalButtonText,
                { fontSize: getDynamicFontSize(16) }
              ]}>
                Çıkış Yap
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
            {renderSettingItem('bell-outline', 'Bildirim Ayarları')}
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
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontWeight: '600',
    marginTop: 16,
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
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  logoutModalButton: {
    backgroundColor: '#f44336',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  logoutModalButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default SettingsScreen;