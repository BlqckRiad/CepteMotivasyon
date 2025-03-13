import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { useNavigation } from '@react-navigation/native';

const getTabletDimensions = () => {
  const windowDimensions = Dimensions.get('window');
  return {
    isTablet: windowDimensions.width >= 768,
    width: windowDimensions.width,
    height: windowDimensions.height,
  };
};

const AuthScreen = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dimensions, setDimensions] = useState(getTabletDimensions());
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getTabletDimensions());
    });

    return () => subscription?.remove();
  }, []);

  const { signIn, signUp } = useAuth();

  const validateForm = () => {
    if (isLogin) {
      if (!formData.emailOrUsername || !formData.password) {
        setError('Tüm alanları doldurunuz');
        return false;
      }
    } else {
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Tüm alanları doldurunuz');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Şifreler eşleşmiyor');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Şifre en az 6 karakter olmalıdır');
        return false;
      }
      if (!formData.email.includes('@')) {
        setError('Geçerli bir email adresi giriniz');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');
      if (!validateForm()) return;
      
      setLoading(true);
      if (isLogin) {
        const result = await signIn({
          emailOrUsername: formData.emailOrUsername,
          password: formData.password,
        });
        if (result.session) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
        await signUp({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        setSuccess(
          'Başarıyla kayıt oldunuz! Lütfen e-posta adresinize gönderilen onay bağlantısına tıklayarak hesabınızı doğrulayın. Onayladıktan sonra giriş yapabilirsiniz.'
        );
        // Formu temizle
        setFormData({
          emailOrUsername: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        // Login formuna geç
        setIsLogin(true);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (placeholder, value, onChangeText, options = {}) => (
    <View style={styles.inputContainer}>
      <MaterialCommunityIcons
        name={options.icon}
        size={24}
        color="#666"
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#999"
        autoCapitalize="none"
        secureTextEntry={options.secure}
        keyboardType={options.keyboardType || 'default'}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          dimensions.isTablet && styles.scrollContainerTablet,
          dimensions.width > dimensions.height && styles.formContainerLandscape
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[
          styles.formContainer,
          dimensions.isTablet && styles.formContainerTablet,
          dimensions.width > dimensions.height && styles.formContainerLandscape
        ]}>
          <View style={styles.headerContainer}>
            <MaterialCommunityIcons
              name={isLogin ? "login" : "account-plus"}
              size={dimensions.isTablet ? 60 : 48}
              color="#4CAF50"
            />
            <Text style={[styles.title, dimensions.isTablet && styles.titleTablet]}>
              {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
            </Text>
            <Text style={[styles.subtitle, dimensions.isTablet && styles.subtitleTablet]}>
              {isLogin 
                ? 'Motivasyon dolu dünyamıza giriş yapın'
                : 'Yeni bir başlangıç için kayıt olun'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={dimensions.isTablet ? 28 : 24} 
                color="#f44336" 
              />
              <Text style={[styles.errorText, dimensions.isTablet && styles.errorTextTablet]}>
                {error}
              </Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons 
                name="check-circle" 
                size={dimensions.isTablet ? 28 : 24} 
                color="#4CAF50" 
              />
              <Text style={[styles.successText, dimensions.isTablet && styles.successTextTablet]}>
                {success}
              </Text>
            </View>
          ) : null}

          <View style={styles.formContent}>
            {!isLogin && renderInput(
              'Kullanıcı Adı',
              formData.username,
              (text) => setFormData({ ...formData, username: text }),
              { icon: 'account' }
            )}

            {!isLogin && renderInput(
              'E-posta',
              formData.email,
              (text) => setFormData({ ...formData, email: text }),
              { icon: 'email', keyboardType: 'email-address' }
            )}

            {isLogin && renderInput(
              'E-posta veya Kullanıcı Adı',
              formData.emailOrUsername,
              (text) => setFormData({ ...formData, emailOrUsername: text }),
              { icon: 'account' }
            )}

            {renderInput(
              'Şifre',
              formData.password,
              (text) => setFormData({ ...formData, password: text }),
              { icon: 'lock', secure: true }
            )}

            {!isLogin && renderInput(
              'Şifre Tekrar',
              formData.confirmPassword,
              (text) => setFormData({ ...formData, confirmPassword: text }),
              { icon: 'lock-check', secure: true }
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={isLogin ? "login" : "account-plus"}
                    size={24}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>
                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setFormData({
                  emailOrUsername: '',
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                });
              }}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? 'Hesabın yok mu? Kayıt ol'
                  : 'Zaten hesabın var mı? Giriş yap'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContainerTablet: {
    padding: 40,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formContainerTablet: {
    padding: 30,
    maxWidth: 500,
  },
  formContainerLandscape: {
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  titleTablet: {
    fontSize: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  subtitleTablet: {
    fontSize: 20,
  },
  formContent: {
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputTablet: {
    paddingVertical: 16,
    fontSize: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  errorTextTablet: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonTablet: {
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextTablet: {
    fontSize: 18,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  switchButtonTextTablet: {
    fontSize: 16,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#2E7D32',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  successTextTablet: {
    fontSize: 16,
    lineHeight: 24,
  },
});

const styles = StyleSheet.create(baseStyles);

export default AuthScreen; 