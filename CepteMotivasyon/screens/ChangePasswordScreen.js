import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { supabase } from '../lib/supabase';

const ChangePasswordScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalType, setResultModalType] = useState('success'); // 'success' veya 'error'
  const [resultMessage, setResultMessage] = useState('');
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

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');

    try {
      // Supabase Auth'un updateUser fonksiyonunu kullanarak şifre değiştirme
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        password_confirm: currentPassword // Mevcut şifreyi doğrulamak için
      });

      if (error) {
        if (error.message.includes('password_confirm')) {
          setPasswordError('Mevcut şifre yanlış');
        } else {
          throw error;
        }
        return;
      }

      // Başarılı modal göster
      setResultModalType('success');
      setResultMessage('Şifreniz başarıyla değiştirildi.');
      setShowResultModal(true);
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      setResultModalType('error');
      setResultMessage('Şifre değiştirilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowResultModal(true);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleModalClose = () => {
    setShowResultModal(false);
    if (resultModalType === 'success') {
      navigation.goBack();
    }
  };

  const ResultModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showResultModal}
      onRequestClose={handleModalClose}
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
          <MaterialCommunityIcons 
            name={resultModalType === 'success' ? 'check-circle' : 'alert-circle'} 
            size={getDynamicFontSize(64)} 
            color={resultModalType === 'success' ? colors.success : colors.error} 
          />
          
          <Text style={[
            styles.modalTitle,
            { 
              color: colors.text,
              fontSize: getDynamicFontSize(20),
              marginTop: getDynamicPadding(16)
            }
          ]}>
            {resultModalType === 'success' ? 'Başarılı' : 'Hata'}
          </Text>
          
          <Text style={[
            styles.modalMessage,
            { 
              color: colors.subtext,
              fontSize: getDynamicFontSize(16),
              marginTop: getDynamicPadding(8),
              textAlign: 'center'
            }
          ]}>
            {resultMessage}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.modalButton,
              { 
                backgroundColor: resultModalType === 'success' ? colors.success : colors.error,
                marginTop: getDynamicPadding(24),
                padding: getDynamicPadding(12)
              }
            ]}
            onPress={handleModalClose}
          >
            <Text style={[
              styles.modalButtonText,
              { 
                color: '#fff',
                fontSize: getDynamicFontSize(16),
                fontWeight: '600'
              }
            ]}>
              {resultModalType === 'success' ? 'Tamam' : 'Tekrar Dene'}
            </Text>
          </TouchableOpacity>
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
      <View style={styles.contentContainer}>
        <View style={[
          styles.header,
          { backgroundColor: colors.card }
        ]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons 
              name="arrow-left" 
              size={getIconSize()} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <Text style={[
            styles.headerTitle,
            { 
              color: colors.text,
              fontSize: getDynamicFontSize(20)
            }
          ]}>
            Şifre Değiştir
          </Text>
        </View>

        <View style={[
          styles.formContainer,
          { backgroundColor: colors.card }
        ]}>
          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Mevcut Şifre
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: getDynamicFontSize(16),
                  padding: getDynamicPadding(12)
                }
              ]}
              placeholder="Mevcut şifrenizi girin"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Yeni Şifre
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: getDynamicFontSize(16),
                  padding: getDynamicPadding(12)
                }
              ]}
              placeholder="Yeni şifrenizi girin"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              returnKeyType="next"
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[
              styles.inputLabel,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              Yeni Şifre (Tekrar)
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                  fontSize: getDynamicFontSize(16),
                  padding: getDynamicPadding(12)
                }
              ]}
              placeholder="Yeni şifrenizi tekrar girin"
              placeholderTextColor={colors.subtext}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handlePasswordChange}
            />
          </View>

          {passwordError ? (
            <View style={[
              styles.errorContainer,
              { 
                backgroundColor: colors.error + '20',
                padding: getDynamicPadding(12),
                borderRadius: 8,
                marginTop: getDynamicPadding(8)
              }
            ]}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={getDynamicFontSize(20)} 
                color={colors.error}
                style={{ marginRight: 8 }}
              />
              <Text style={[
                styles.errorText,
                { 
                  color: colors.error,
                  fontSize: getDynamicFontSize(14),
                  flex: 1
                }
              ]}>
                {passwordError}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.changeButton,
              { 
                backgroundColor: colors.primary,
                padding: getDynamicPadding(16),
                marginTop: getDynamicPadding(24)
              }
            ]}
            onPress={handlePasswordChange}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[
                styles.changeButtonText,
                { 
                  color: '#fff',
                  fontSize: getDynamicFontSize(16),
                  fontWeight: '600'
                }
              ]}>
                Şifreyi Değiştir
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ResultModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontWeight: '600',
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    flex: 1,
  },
  changeButton: {
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    textAlign: 'center',
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
  },
  modalMessage: {
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    textAlign: 'center',
  },
});

export default ChangePasswordScreen; 