import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

const BadgesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [userStats, setUserStats] = useState({
    streak: 0,
    completedTasks: 0,
    loginDays: 0
  });

  const badgeTypes = [
    { id: 1, name: 'Streak', icon: 'fire', color: '#FF6B6B', description: 'Günlük görev serisi başarıları' },
    { id: 2, name: 'Görev', icon: 'trophy', color: '#4ECDC4', description: 'Görev tamamlama başarıları' },
    { id: 3, name: 'Gün', icon: 'calendar-check', color: '#45B7D1', description: 'Uygulama kullanım başarıları' }
  ];

  useEffect(() => {
    fetchUserStats();
    fetchBadges();
  }, []);

  const fetchUserStats = async () => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_streak, completed_tasks')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data: tasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('created_at')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      const uniqueLoginDays = new Set(
        tasks.map(task => new Date(task.created_at).toDateString())
      ).size;

      setUserStats({
        streak: profile.user_streak || 0,
        completedTasks: profile.completed_tasks || 0,
        loginDays: uniqueLoginDays
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;

      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*, badge_types(*)')
        .order('level', { ascending: true });

      if (badgesError) throw badgesError;

      const badgesWithStatus = allBadges.map(badge => ({
        ...badge,
        isUnlocked: userBadges.some(ub => ub.badge_id === badge.id)
      }));

      setBadges(badgesWithStatus);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge);
    setShowModal(true);
  };

  const getProgressForBadge = (badge) => {
    const stats = {
      1: userStats.streak,
      2: userStats.completedTasks,
      3: userStats.loginDays
    };
    return Math.min(100, (stats[badge.badge_type_id] / badge.requirement) * 100);
  };

  const renderBadgeType = (type) => {
    const isSelected = selectedType?.id === type.id;
    const typeBadges = badges.filter(b => b.badge_types.id === type.id);
    const unlockedCount = typeBadges.filter(b => b.isUnlocked).length;
    const totalCount = typeBadges.length;

    return (
      <TouchableOpacity
        key={type.id}
        style={[
          styles.badgeTypeCard,
          { 
            backgroundColor: isSelected ? type.color + '20' : colors.card,
            borderColor: isSelected ? type.color : colors.border
          }
        ]}
        onPress={() => setSelectedType(isSelected ? null : type)}
      >
        <View style={[styles.badgeTypeIcon, { backgroundColor: type.color + '20' }]}>
          <MaterialCommunityIcons
            name={type.icon}
            size={28}
            color={type.color}
          />
        </View>
        <Text style={[styles.badgeTypeName, { color: colors.text }]}>
          {type.name}
        </Text>
        <Text style={[styles.badgeTypeCount, { color: colors.subtext }]}>
          {unlockedCount}/{totalCount}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBadge = (badge) => {
    const progress = getProgressForBadge(badge);
    const type = badgeTypes.find(t => t.id === badge.badge_type_id);

    return (
      <TouchableOpacity
        key={badge.id}
        style={[
          styles.badgeCard,
          { 
            backgroundColor: colors.card,
            borderColor: badge.isUnlocked ? type.color : colors.border,
            opacity: selectedType && selectedType.id !== badge.badge_type_id ? 0.5 : 1
          }
        ]}
        onPress={() => handleBadgePress(badge)}
      >
        <View style={[
          styles.badgeImageContainer,
          { backgroundColor: type.color + '10' }
        ]}>
          <MaterialCommunityIcons
            name={type.icon}
            size={32}
            color={badge.isUnlocked ? type.color : colors.border}
            style={[
              styles.badgeIcon,
              !badge.isUnlocked && { opacity: 0.5 }
            ]}
          />
          {!badge.isUnlocked && (
            <View style={styles.lockOverlay}>
              <MaterialCommunityIcons
                name="lock"
                size={20}
                color={colors.border}
              />
            </View>
          )}
        </View>
        
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeName, { color: colors.text }]}>
            {`Seviye ${badge.level}`}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border + '40' }]}>
            <View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: type.color,
                  width: `${progress}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.subtext }]}>
            {Math.min(
              badge.badge_type_id === 1 ? userStats.streak :
              badge.badge_type_id === 2 ? userStats.completedTasks :
              userStats.loginDays,
              badge.requirement
            )}/{badge.requirement}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Rozetler
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeTypesContainer}>
          {badgeTypes.map(renderBadgeType)}
        </View>

        <View style={styles.badgesGrid}>
          {badges
            .filter(badge => !selectedType || badge.badge_types.id === selectedType.id)
            .map(renderBadge)}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {selectedBadge && (
              <>
                <View style={[
                  styles.modalBadgeContainer,
                  { 
                    backgroundColor: badgeTypes.find(t => t.id === selectedBadge.badge_type_id).color + '10'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={badgeTypes.find(t => t.id === selectedBadge.badge_type_id).icon}
                    size={64}
                    color={badgeTypes.find(t => t.id === selectedBadge.badge_type_id).color}
                    style={[
                      styles.modalBadgeIcon,
                      !selectedBadge.isUnlocked && { opacity: 0.5 }
                    ]}
                  />
                  {!selectedBadge.isUnlocked && (
                    <View style={styles.modalLockOverlay}>
                      <MaterialCommunityIcons
                        name="lock"
                        size={32}
                        color={colors.border}
                      />
                    </View>
                  )}
                </View>

                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {`Seviye ${selectedBadge.level} ${selectedBadge.badge_types.name} Rozeti`}
                </Text>

                <Text style={[styles.modalDescription, { color: colors.subtext }]}>
                  {selectedBadge.isUnlocked ? 
                    'Bu rozeti kazandınız! Tebrikler!' :
                    `Bu rozeti kazanmak için ${selectedBadge.requirement} ${
                      selectedBadge.badge_type_id === 1 ? 'günlük seri' :
                      selectedBadge.badge_type_id === 2 ? 'görev tamamlamalısınız' :
                      'gün giriş yapmalısınız'
                    }.`
                  }
                </Text>

                <View style={styles.modalProgressContainer}>
                  <View style={[
                    styles.modalProgressBar,
                    { backgroundColor: colors.border + '40' }
                  ]}>
                    <View 
                      style={[
                        styles.modalProgressFill,
                        { 
                          backgroundColor: badgeTypes.find(t => t.id === selectedBadge.badge_type_id).color,
                          width: `${getProgressForBadge(selectedBadge)}%`
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.modalProgressText, { color: colors.text }]}>
                    {Math.min(
                      selectedBadge.badge_type_id === 1 ? userStats.streak :
                      selectedBadge.badge_type_id === 2 ? userStats.completedTasks :
                      userStats.loginDays,
                      selectedBadge.requirement
                    )}/{selectedBadge.requirement}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: badgeTypes.find(t => t.id === selectedBadge.badge_type_id).color }
                  ]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonText}>Tamam</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  badgeTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  badgeTypeCard: {
    width: '31%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  badgeTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTypeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeTypeCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  badgesGrid: {
    padding: 16,
    paddingTop: 0,
  },
  badgeCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  badgeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    opacity: 1,
  },
  lockOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  badgeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBadgeIcon: {
    opacity: 1,
  },
  modalLockOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  modalProgressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  modalProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalProgressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BadgesScreen; 