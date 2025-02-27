import React, { useState } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase.js';

const SuccessCard = ({ visible, message, onClose }) => {
  const [animation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
      ]).start(() => {
        onClose();
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.successCardContainer,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.successCard}
      >
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={50} color="#FFF" />
        </View>
        <Text style={styles.successCardTitle}>Kayıt Başarılı!</Text>
        <Text style={styles.successCardText}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Lütfen geçerli bir e-posta adresi girin');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Giriş işlemi
        const { error } = await signIn(email, password);
        
        if (error) {
          setError('E-posta veya şifre hatalı');
          return;
        }

        // Başarılı giriş
        navigation.navigate('Main');
      } else {
        // Kayıt işlemi
        const { error } = await signUp(email, password);
        
        if (error) {
          if (error.message.includes('already registered')) {
            setError('Bu e-posta adresi zaten kayıtlı');
          } else {
            setError('Kayıt olurken bir hata oluştu');
          }
          return;
        }

        // Başarılı kayıt
        setShowSuccessCard(true);
        setEmail('');
        setPassword('');
        setIsLogin(true);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessCardClose = () => {
    setShowSuccessCard(false);
    setIsLogin(true);
  };

  const handleContinueWithoutLogin = () => {
    navigation.navigate('Main');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#6C63FF', '#4CAF50']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Ionicons name="lock-closed" size={50} color="#FFF" />
          <Text style={styles.title}>Cepte Motivasyon</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
          </Text>
        </LinearGradient>

        <SuccessCard
          visible={showSuccessCard}
          message="Hesabınız başarıyla oluşturuldu! Lütfen e-posta adresinize gönderilen onay bağlantısına tıklayarak hesabınızı aktifleştirin. Onayladıktan sonra giriş yapabilirsiniz."
          onClose={handleSuccessCardClose}
        />

        <View style={styles.form}>
          {error ? (
            <View style={styles.messageContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? 'Hesabınız yok mu? Kayıt olun'
                : 'Zaten hesabınız var mı? Giriş yapın'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueWithoutLogin}
          >
            <Text style={styles.continueButtonText}>
              Giriş Yapmadan Devam Et
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
    opacity: 0.9,
  },
  form: {
    padding: 20,
    marginTop: 20,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#FFE5E5',
  },
  errorText: {
    color: '#D32F2F',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#6C63FF',
    fontSize: 16,
  },
  continueButton: {
    marginTop: 20,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: '500',
  },
  successCardContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: 'center',
  },
  successCard: {
    width: '100%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  successCardText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 24,
  },
}); 