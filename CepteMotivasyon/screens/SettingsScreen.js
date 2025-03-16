import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const navigation = useNavigation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => {
      subscription?.remove();
    };
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

  const ThemeModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showThemeModal}
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={() => setShowThemeModal(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="theme-light-dark" size={48} color={colors.primary} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Tema Seçin</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: !isDarkMode ? colors.primary : colors.card },
                { borderColor: colors.border }
              ]}
              onPress={() => {
                if (isDarkMode) toggleTheme();
                setShowThemeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="white-balance-sunny"
                size={24}
                color={!isDarkMode ? '#fff' : colors.text}
              />
              <Text style={[
                styles.themeOptionText,
                { color: !isDarkMode ? '#fff' : colors.text }
              ]}>
                Açık Tema
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: isDarkMode ? colors.primary : colors.card },
                { borderColor: colors.border }
              ]}
              onPress={() => {
                if (!isDarkMode) toggleTheme();
                setShowThemeModal(false);
              }}
            >
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={24}
                color={isDarkMode ? '#fff' : colors.text}
              />
              <Text style={[
                styles.themeOptionText,
                { color: isDarkMode ? '#fff' : colors.text }
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
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="logout-alert" size={48} color="#f44336" />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Çıkış Yap</Text>
          <Text style={[styles.modalText, { color: colors.subtext }]}>
            Hesabınızdan çıkış yapmak istediğinize emin misiniz?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.logoutModalButton]}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
              <Text style={styles.logoutModalButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.contentContainer,
        orientation === 'landscape' && {
          flexDirection: 'row',
          paddingHorizontal: '5%',
          flexWrap: 'wrap',
        }
      ]}>
        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            flex: 0.48,
            marginRight: '2%',
          }
        ]}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[
              styles.sectionTitle,
              { color: colors.text },
              orientation === 'landscape' && { fontSize: 20 }
            ]}>Uygulama Ayarları</Text>
            <TouchableOpacity style={styles.settingItem}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Bildirim Ayarları</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowThemeModal(true)}
            >
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Tema Ayarları</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            flex: 0.48,
            marginLeft: '2%',
          }
        ]}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[
              styles.sectionTitle,
              { color: colors.text },
              orientation === 'landscape' && { fontSize: 20 }
            ]}>Hesap</Text>
            <TouchableOpacity style={styles.settingItem}>
              <MaterialCommunityIcons
                name="account-edit-outline"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Profil Düzenle</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Şifre Değiştir</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[
          styles.settingsSection,
          orientation === 'landscape' && {
            flex: 1,
            marginTop: 16,
          }
        ]}>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[
              styles.sectionTitle,
              { color: colors.text },
              orientation === 'landscape' && { fontSize: 20 }
            ]}>Diğer</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('Help')}
            >
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Yardım</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => navigation.navigate('About')}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
              <Text style={[
                styles.settingText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 18 }
              ]}>Hakkında</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={orientation === 'landscape' ? 28 : 24}
                color={colors.subtext}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            orientation === 'landscape' && {
              width: '50%',
              alignSelf: 'center',
            }
          ]}
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialCommunityIcons
            name="logout"
            size={orientation === 'landscape' ? 28 : 24}
            color="#fff"
          />
          <Text style={[
            styles.logoutButtonText,
            orientation === 'landscape' && { fontSize: 18 }
          ]}>Çıkış Yap</Text>
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
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
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
    fontSize: 16,
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
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
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
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: '600',
  },
  logoutModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 8,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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