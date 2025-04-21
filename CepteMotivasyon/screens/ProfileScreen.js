import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import StreakService from '../services/StreakService';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
  // State tanımlamaları
  const [profileData, setProfileData] = useState({
    completed_tasks: 0,
    achievement_points: 0,
    user_streak: 0,
    profile_image_url: null
  });
  const [taskStatus, setTaskStatus] = useState([]);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [badges, setBadges] = useState([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [highestBadgeLevels, setHighestBadgeLevels] = useState({
    1: 0, // Streak
    2: 0, // Görev
    3: 0  // Gün
  });

  // Tablet kontrolü
  const isTablet = () => {
    const { width, height } = Dimensions.get('window');
    return Math.min(width, height) >= 768;
  };

  // Dinamik stil hesaplayıcılar
  const getDynamicFontSize = (baseSize) => isTablet() ? baseSize * 1.3 : baseSize;
  const getDynamicPadding = (basePadding) => isTablet() ? basePadding * 1.5 : basePadding;
  const getIconSize = () => isTablet() ? (orientation === 'landscape' ? 32 : 28) : 24;
  const getAvatarSize = () => {
    if (isTablet()) {
      return orientation === 'landscape' ? 160 : 140;
    }
    return orientation === 'landscape' ? 120 : 100;
  };

  // Veri çekme fonksiyonları
  const fetchProfileData = async () => {
    try {
      if (!user?.id) return;

      // Profil bilgilerini getir
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Profil fotoğrafı URL'sini user_metadata'dan al
      const avatarUrl = user?.user_metadata?.avatar_url;
      
      // Eğer avatarUrl varsa ve profiles tablosunda yoksa, güncelle
      if (avatarUrl && (!profileData.profile_image_url || profileData.profile_image_url !== avatarUrl)) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ profile_image_url: avatarUrl })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      }

      setProfileData({
        completed_tasks: profileData.completed_tasks || 0,
        achievement_points: profileData.achievement_points || 0,
        user_streak: profileData.user_streak || 0,
        profile_image_url: profileData.profile_image_url || avatarUrl
      });

      // ... existing code ...
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const updateStreakData = async () => {
    try {
      const { streak, statusData } = await StreakService.calculateStreak(user.id);
      setTaskStatus(statusData);
      
      if (streak !== profileData.user_streak) {
        setProfileData(prev => ({
          ...prev,
          user_streak: streak
        }));
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  // Yardımcı fonksiyonlar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('tr-TR', { month: 'short' });
    return `${day} ${month}`;
  };

  // Profil düzenleme fonksiyonları
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
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, formData, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
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
      
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditProfile = () => {
    navigation.navigate('EditProfile', {
      username: user?.user_metadata?.username || '',
      avatarUrl: profileData.profile_image_url
    });
  };

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Streak'i kontrol et ve güncelle
      const newStreak = await StreakService.checkAndUpdateStreak(user.id);
     
      // Kullanıcı verilerini güncelle
      setProfileData({
        ...profile,
        user_streak: newStreak
      });

      // Streak verilerini al
      const streakData = await StreakService.calculateStreak(user.id);
      setTaskStatus(streakData.statusData);

    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Hata', 'Kullanıcı verileri alınamadı');
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  // Sayfa her odaklandığında verileri güncelle
  useFocusEffect(
    useCallback(() => {
    
      fetchUserData();
    }, [fetchUserData])
  );

  // Rozet verilerini çekme fonksiyonunu güncelle
  const fetchUserBadges = async () => {
    try {
      // Önce tüm rozetleri ve kullanıcının rozet durumlarını çek
      const { data: badges, error } = await supabase
        .from('badges')
        .select(`
          *,
          badge_types (*),
          user_badges (
            id,
            is_achieved,
            user_id
          )
        `)
        .order('level', { ascending: true });

      if (error) throw error;

      // Kullanıcının rozetlerini filtrele ve en yüksek seviyeleri hesapla
      const userBadges = badges.filter(badge => 
        badge.user_badges.some(ub => ub.user_id === user.id && ub.is_achieved)
      );

      // Her rozet tipi için en yüksek seviyeyi hesapla
      const highestLevels = badges.reduce((acc, badge) => {
        const typeId = badge.badge_types.id;
        const isAchieved = badge.user_badges.some(ub => 
          ub.user_id === user.id && ub.is_achieved
        );

        if (isAchieved) {
          acc[typeId] = Math.max(acc[typeId] || 0, badge.level);
        }
        return acc;
      }, {1: 0, 2: 0, 3: 0});

      setHighestBadgeLevels(highestLevels);
      setEarnedBadges(userBadges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  // useFocusEffect'i güncelle
  useFocusEffect(
    React.useCallback(() => {
      fetchUserBadges();
    }, [])
  );

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription?.remove();
  }, []);

  // Render fonksiyonları
  const InfoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showInfoModal}
      onRequestClose={() => setShowInfoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { 
            backgroundColor: colors.card,
            width: isTablet() ? '60%' : '85%',
            padding: getDynamicPadding(24)
          }
        ]}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: colors.background }
            ]}
            onPress={() => setShowInfoModal(false)}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={getIconSize()} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <MaterialCommunityIcons 
            name="star" 
            size={getDynamicFontSize(48)} 
            color={colors.primary} 
          />
          
          <Text style={[
            styles.modalTitle,
            { 
              color: colors.text,
              fontSize: getDynamicFontSize(20)
            }
          ]}>
            Başarı Puanı Sistemi
          </Text>
          
          <Text style={[
            styles.modalText,
            { 
              color: colors.subtext,
              fontSize: getDynamicFontSize(16)
            }
          ]}>
            Her tamamlanan görev için 2 başarı puanı kazanırsınız. 
            Puanlarınızı biriktirerek yeni başarılar açabilirsiniz.
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderStreakDays = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    const avatarSize = getAvatarSize();
    
    return (
      <View style={[
        styles.streakContainer,
        { 
          backgroundColor: colors.card,
          padding: getDynamicPadding(16)
        }
      ]}>
        <View style={styles.streakHeader}>
          <View style={styles.streakInfo}>
            <MaterialCommunityIcons 
              name="fire" 
              size={getIconSize()} 
              color={colors.primary} 
            />
            <Text style={[
              styles.streakText,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(18)
              }
            ]}>
              {profileData.user_streak} Gün Streak!
            </Text>
          </View>
        </View>
        
        <View style={styles.daysContainer}>
          {taskStatus.map((status, index) => (
            <View key={index} style={styles.dayItem}>
              <View style={[
                styles.dayIndicator,
                {
                  width: getDynamicPadding(28),
                  height: getDynamicPadding(28),
                  borderRadius: getDynamicPadding(14),
                  backgroundColor: 
                    status.status === 2 ? '#4CAF50' :
                    status.status === 1 ? '#FFC107' :
                    '#F44336'
                }
              ]} />
              <Text style={[
                styles.dayText,
                { 
                  color: colors.subtext,
                  fontSize: getDynamicFontSize(12)
                }
              ]}>
                {days[new Date(status.date).getDay()]}
              </Text>
              <Text style={[
                styles.dateText,
                { 
                  color: colors.subtext,
                  fontSize: getDynamicFontSize(11)
                }
              ]}>
                {formatDate(status.date)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBadgeIcons = () => {
    const badgeTypes = [
      { id: 2, name: 'Görev', icon: 'check-circle' },
      { id: 1, name: 'Streak', icon: 'fire' },
      { id: 3, name: 'Gün', icon: 'calendar' }
    ];

    return (
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Rozetlerim
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Badges')}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Tümünü Gör
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.badgeIconsContainer}>
          {badgeTypes.map((type) => (
            <View
              key={type.id}
              style={[
                styles.badgeIconCard,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }
              ]}
            >
              <View style={[
                styles.badgeIconWrapper,
                { 
                  backgroundColor: highestBadgeLevels[type.id] > 0 
                    ? colors.primary + '15' 
                    : colors.border + '40'
                }
              ]}>
                <MaterialCommunityIcons
                  name={type.icon}
                  size={32}
                  color={highestBadgeLevels[type.id] > 0 ? colors.primary : colors.subtext}
                />
              </View>
              <Text style={[
                styles.badgeTypeName,
                { 
                  color: colors.text,
                  opacity: highestBadgeLevels[type.id] > 0 ? 1 : 0.6
                }
              ]}>
                {type.name}
              </Text>
              <View style={[
                styles.badgeLevelBadge,
                { 
                  backgroundColor: highestBadgeLevels[type.id] > 0 
                    ? colors.primary + '15' 
                    : colors.border + '40'
                }
              ]}>
                <Text style={[
                  styles.badgeLevelText,
                  { 
                    color: highestBadgeLevels[type.id] > 0 
                      ? colors.primary 
                      : colors.subtext
                  }
                ]}>
                  {highestBadgeLevels[type.id] > 0 
                    ? `Seviye ${highestBadgeLevels[type.id]}` 
                    : 'Kilitli'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Ana render
  return (
    <ScrollView 
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingHorizontal: getDynamicPadding(16) }
      ]}
    >
      <View style={[
        styles.mainContent,
        orientation === 'landscape' && styles.landscapeContent
      ]}>
        <View style={[
          styles.profileSection,
          orientation === 'landscape' && styles.landscapeProfileSection
        ]}>
          <View style={[
            styles.header,
            { 
              backgroundColor: colors.card,
              padding: getDynamicPadding(20)
            }
          ]}>
            <View style={styles.avatarContainer}>
              <Image
                source={profileData.profile_image_url ? 
                  { uri: profileData.profile_image_url } : 
                  require('../assets/default-avatar.png')}
                style={[
                  styles.avatar,
                  {
                    width: getAvatarSize(),
                    height: getAvatarSize(),
                    borderRadius: getAvatarSize() / 2
                  }
                ]}
              />
              <TouchableOpacity 
                style={[
                  styles.editAvatarButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={openEditProfile}
              >
                <MaterialCommunityIcons 
                  name="camera" 
                  size={getIconSize()} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[
              styles.username,
              { 
                color: colors.text,
                fontSize: getDynamicFontSize(24)
              }
            ]}>
              {user?.user_metadata?.username || 'Kullanıcı'}
            </Text>
            
            <Text style={[
              styles.email,
              { 
                color: colors.subtext,
                fontSize: getDynamicFontSize(16)
              }
            ]}>
              {user?.email}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.editProfileButton,
                { 
                  backgroundColor: colors.primary,
                  marginTop: getDynamicPadding(16),
                  padding: getDynamicPadding(12),
                  borderRadius: 10
                }
              ]}
              onPress={openEditProfile}
            >
              <MaterialCommunityIcons 
                name="pencil" 
                size={getIconSize()} 
                color="#fff" 
                style={{ marginRight: 8 }}
              />
              <Text style={[
                styles.editProfileButtonText,
                { 
                  color: '#fff',
                  fontSize: getDynamicFontSize(16),
                  fontWeight: '600'
                }
              ]}>
                Profili Düzenle
              </Text>
            </TouchableOpacity>
          </View>

          
        </View>

        <View style={[
          styles.streakSection,
          orientation === 'landscape' && styles.landscapeStreakSection
        ]}>
          {renderStreakDays()}
        </View>

        <View style={[
          styles.achievementsSection,
          orientation === 'landscape' && styles.landscapeAchievementsSection
        ]}>
          {/* Başarılar bölümü - İleride eklenecek */}
        </View>
      </View>

      {renderBadgeIcons()}

      <InfoModal />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    paddingVertical: 20,
  },
  mainContent: {
    width: '100%',
  },
  landscapeContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  profileSection: {
    width: '100%',
  },
  landscapeProfileSection: {
    width: '49%',
  },
  streakSection: {
    width: '100%',
    marginTop: 16,
  },
  landscapeStreakSection: {
    width: '49%',
    marginTop: 0,
  },
  achievementsSection: {
    width: '100%',
    marginTop: 16,
  },
  landscapeAchievementsSection: {
    width: '100%',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    borderRadius: 50,
  },
  userInfo: {
    flex: 1,
  },
  statsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  streakContainer: {
    width: '100%',
    marginTop: 20,
    borderRadius: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    marginLeft: 8,
  },
  dayItem: {
    width: '14%',
    alignItems: 'center',
    marginBottom: 12,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 15,
  },
  infoButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 4,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  streakText: {
    marginLeft: 8,
  },
  dayIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 4,
  },
  dayText: {
    marginBottom: 4,
  },
  dateText: {
    marginTop: 4,
  },
  editAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  editAvatarWrapper: {
    position: 'relative',
  },
  editAvatar: {
    borderRadius: 50,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
  },
  saveButton: {
    width: '100%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    textAlign: 'center',
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  modalText: {
    textAlign: 'center',
    marginTop: 8,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editProfileButtonText: {
    textAlign: 'center',
  },
  section: {
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeProgress: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#fff',
    fontWeight: '600',
  },
  badgesContainer: {
    paddingVertical: 8,
  },
  emptyBadgesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyBadgesText: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  earnBadgesButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  earnBadgesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  badgeCard: {
    width: 100,
    height: 130,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeTypeText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLevelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  badgeIconCard: {
    width: '31%',
    aspectRatio: 0.8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeTypeName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default ProfileScreen;