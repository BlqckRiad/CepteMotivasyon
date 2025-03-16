import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import StreakService from '../services/StreakService';

const ProfileScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [profileData, setProfileData] = useState({
    completed_tasks: 0,
    achievement_points: 0,
    user_streak: 0
  });
  const [taskStatus, setTaskStatus] = useState([]);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  const [showInfoModal, setShowInfoModal] = useState(false);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('completed_tasks, achievement_points, user_streak')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfileData(data);
      }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('tr-TR', { month: 'short' });
    return `${day} ${month}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();
      updateStreakData();
    }, [])
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

  const InfoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showInfoModal}
      onRequestClose={() => setShowInfoModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.background }]}
            onPress={() => setShowInfoModal(false)}
          >
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <MaterialCommunityIcons name="star" size={48} color={colors.primary} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Başarı Puanı Sistemi</Text>
          <Text style={[styles.modalText, { color: colors.subtext }]}>
            Her tamamlanan görev için 2 başarı puanı kazanırsınız. Puanlarınızı biriktirerek yeni başarılar açabilirsiniz.
          </Text>
        </View>
      </View>
    </Modal>
  );

  const renderStreakDays = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    
    return (
      <View style={[styles.streakContainer, { backgroundColor: colors.card }]}>
        <View style={styles.streakHeader}>
          <View style={styles.streakInfo}>
            <MaterialCommunityIcons name="fire" size={24} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.text }]}>
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
                  backgroundColor: 
                    status.status === 2 ? '#4CAF50' :  // Yeşil - tüm görevler tamamlandı
                    status.status === 1 ? '#FFC107' :  // Sarı - bazı görevler tamamlandı
                    '#F44336'                          // Kırmızı - hiç görev tamamlanmadı
                }
              ]} />
              <Text style={[styles.dayText, { color: colors.subtext }]}>
                {days[new Date(status.date).getDay()]}
              </Text>
              <Text style={[styles.dateText, { color: colors.subtext }]}>
                {formatDate(status.date)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.contentContainer,
        orientation === 'landscape' && {
          flexDirection: 'row',
          paddingHorizontal: '5%',
        }
      ]}>
        <View style={[
          styles.profileSection,
          orientation === 'landscape' && {
            flex: 1,
            marginRight: 10,
          }
        ]}>
          <View style={[styles.header, { backgroundColor: colors.card }]}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../assets/default-avatar.png')}
                style={[styles.avatar, orientation === 'landscape' && { width: 120, height: 120, borderRadius: 60 }]}
              />
              <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="camera" size={orientation === 'landscape' ? 24 : 20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={[
              styles.username,
              { color: colors.text },
              orientation === 'landscape' && { fontSize: 28 }
            ]}>
              {user?.user_metadata?.username || 'Kullanıcı'}
            </Text>
            <Text style={[
              styles.email,
              { color: colors.subtext },
              orientation === 'landscape' && { fontSize: 18 }
            ]}>
              {user?.email}
            </Text>
          </View>

          {renderStreakDays()}

          <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              onPress={() => setShowInfoModal(true)}
              style={styles.infoButtonContainer}
            >
              <MaterialCommunityIcons
                name="information"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: colors.primary },
                orientation === 'landscape' && { fontSize: 28 }
              ]}>{profileData.completed_tasks}</Text>
              <Text style={[
                styles.statLabel,
                { color: colors.subtext },
                orientation === 'landscape' && { fontSize: 16 }
              ]}>Tamamlanan Görevler</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: colors.primary },
                orientation === 'landscape' && { fontSize: 28 }
              ]}>{profileData.achievement_points}</Text>
              <Text style={[
                styles.statLabel,
                { color: colors.subtext },
                orientation === 'landscape' && { fontSize: 16 }
              ]}>Başarı Puanı</Text>
            </View>
          </View>
        </View>

        <View style={[
          styles.achievementsSection,
          orientation === 'landscape' && {
            flex: 1,
            marginLeft: 10,
          }
        ]}>
          {/* Başarılar Bölümü - Şimdilik Devre Dışı
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[
              styles.sectionTitle,
              { color: colors.text },
              orientation === 'landscape' && { fontSize: 22 }
            ]}>Başarılar</Text>
            <View style={styles.achievementsContainer}>
              <View style={styles.achievementItem}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={orientation === 'landscape' ? 40 : 32}
                  color="#FFD700"
                />
                <Text style={[
                  styles.achievementLabel,
                  { color: colors.subtext },
                  orientation === 'landscape' && { fontSize: 16 }
                ]}>İlk Görev</Text>
              </View>
              <View style={styles.achievementItem}>
                <MaterialCommunityIcons
                  name="star-outline"
                  size={orientation === 'landscape' ? 40 : 32}
                  color="#C0C0C0"
                />
                <Text style={[
                  styles.achievementLabel,
                  { color: colors.subtext },
                  orientation === 'landscape' && { fontSize: 16 }
                ]}>10 Görev</Text>
              </View>
              <View style={styles.achievementItem}>
                <MaterialCommunityIcons
                  name="medal-outline"
                  size={orientation === 'landscape' ? 40 : 32}
                  color="#CD7F32"
                />
                <Text style={[
                  styles.achievementLabel,
                  { color: colors.subtext },
                  orientation === 'landscape' && { fontSize: 16 }
                ]}>30 Gün</Text>
              </View>
            </View>
          </View>
          */}
        </View>
      </View>
      <InfoModal />
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
  profileSection: {
    marginBottom: 16,
  },
  achievementsSection: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    marginHorizontal: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  achievementItem: {
    alignItems: 'center',
  },
  achievementLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  streakContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
  },
  dayIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 6,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    opacity: 0.8,
  },
});

export default ProfileScreen; 