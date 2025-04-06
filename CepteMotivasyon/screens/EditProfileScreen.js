import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const EditProfileScreen = ({ route, navigation }) => {
  const { username: initialUsername, avatarUrl: initialAvatarUrl } = route.params;
  const [username, setUsername] = useState(initialUsername);
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );

  // Tablet kontrolü
  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    return Math.max(width, height) >= 768;
  };

  // Dinamik boyutlandırma fonksiyonları
  const getDynamicPadding = (base) => {
    if (isTablet()) {
      return orientation === 'landscape' ? base * 1.5 : base * 1.2;
    }
    return base;
  };

  const getDynamicFontSize = (base) => {
    if (isTablet()) {
      return orientation === 'landscape' ? base * 1.3 : base * 1.1;
    }
    return base;
  };

  const getIconSize = () => {
    if (isTablet()) {
      return orientation === 'landscape' ? 32 : 28;
    }
    return 24;
  };

  const getAvatarSize = () => {
    if (isTablet()) {
      return orientation === 'landscape' ? 160 : 140;
    }
    return 120;
  };

  // Başarı modalını göster
  const showSuccessMessage = () => {
    setShowSuccessModal(true);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowSuccessModal(false);
      navigation.goBack();
    });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };

  const uploadAvatar = async () => {
    if (!avatarUri) return null;
    
    setIsUploading(true);
    try {
      const fileExt = avatarUri.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri: avatarUri,
        name: fileName,
        type: `image/${fileExt}`
      });
      
      // Supabase storage'a yükleme işlemi
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Public URL'i al
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Hata', 'Fotoğraf yüklenirken bir hata oluştu.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı boş olamaz.');
      return;
    }
    
    setIsLoading(true);
    try {
      let avatarUrl = null;
      
      if (avatarUri) {
        avatarUrl = await uploadAvatar();
      }
      
      const updates = {
        username: username.trim(),
        ...(avatarUrl && { avatar_url: avatarUrl })
      };
      
      // Kullanıcı bilgilerini güncelle
      const { error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      
      // Profiles tablosunu güncelle
      if (avatarUrl) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ profile_image_url: avatarUrl })
          .eq('id', user.id);
          
        if (profileError) throw profileError;
      }
      
      // Kullanıcı bilgilerini yenile
      if (typeof refreshUser === 'function') {
        await refreshUser();
      } else {
        // refreshUser fonksiyonu yoksa, oturumu yeniden yükle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
      }
      
      showSuccessMessage();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // Başarı modalı
  const SuccessModal = () => (
    <Modal
      transparent={true}
      visible={showSuccessModal}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.successModal,
            { 
              backgroundColor: colors.card,
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })}]
            }
          ]}
        >
          <MaterialCommunityIcons 
            name="check-circle" 
            size={getIconSize() * 2} 
            color={colors.primary} 
          />
          <Text style={[
            styles.successText,
            { 
              color: colors.text,
              fontSize: getDynamicFontSize(18),
              marginTop: getDynamicPadding(16)
            }
          ]}>
            Profil başarıyla güncellendi!
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { 
              backgroundColor: colors.card,
              marginTop: 8
            }
          ]}
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
          Profili Düzenle
        </Text>
        <View style={{ width: getIconSize() }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: getDynamicPadding(16)
        }}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[
            styles.editAvatarContainer,
            { marginBottom: getDynamicPadding(24) }
          ]}>
            <TouchableOpacity 
              style={styles.editAvatarWrapper}
              onPress={pickImage}
              disabled={isUploading}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={[
                    styles.editAvatar,
                    {
                      width: getAvatarSize(),
                      height: getAvatarSize(),
                      borderRadius: getAvatarSize() / 2
                    }
                  ]}
                />
              ) : (
                <Image
                  source={initialAvatarUrl ? 
                    { uri: initialAvatarUrl } : 
                    require('../assets/default-avatar.png')}
                  style={[
                    styles.editAvatar,
                    {
                      width: getAvatarSize(),
                      height: getAvatarSize(),
                      borderRadius: getAvatarSize() / 2
                    }
                  ]}
                />
              )}
              
              <View style={[
                styles.editAvatarButton,
                { backgroundColor: colors.primary }
              ]}>
                {isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialCommunityIcons 
                    name="camera" 
                    size={getIconSize()} 
                    color="#fff" 
                  />
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={[
            styles.inputContainer,
            { marginBottom: getDynamicPadding(16) }
          ]}>
            <Text style={[
              styles.inputLabel,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(16),
                marginBottom: getDynamicPadding(8)
              }
            ]}>
              Kullanıcı Adı
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
              placeholder="Kullanıcı adınızı girin"
              placeholderTextColor={colors.subtext}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: colors.primary,
                padding: getDynamicPadding(16),
                marginTop: getDynamicPadding(24),
                height: 64
              }
            ]}
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.saveButtonContent}>
                <MaterialCommunityIcons 
                  name="content-save" 
                  size={getIconSize()} 
                  color="#fff" 
                  style={{ marginRight: 8 }}
                />
                <Text style={[
                  styles.saveButtonText,
                  { 
                    color: '#fff',
                    fontSize: getDynamicFontSize(16),
                    fontWeight: '600'
                  }
                ]}>
                  Kaydet
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <SuccessModal />
    </KeyboardAvoidingView>
  );
};

const styles = {
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '600',
  },
  editAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarWrapper: {
    position: 'relative',
  },
  editAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  saveButton: {
    width: '100%',
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successText: {
    fontWeight: '600',
    textAlign: 'center',
  },
};

export default EditProfileScreen; 