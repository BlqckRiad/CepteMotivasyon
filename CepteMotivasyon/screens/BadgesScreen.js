import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Alert,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

const BadgesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [availableBadges, setAvailableBadges] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success'); // 'success' or 'error'
  const [userStats, setUserStats] = useState({
    streak: 0,
    completedTasks: 0,
    loginDays: 0
  });

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
      const { data: badges, error } = await supabase
        .from('badges')
        .select(`
          *,
          badge_types (*),
          user_badges (
            id,
            is_achieved
          )
        `)
        .eq('user_badges.user_id', user.id);

      if (error) throw error;

      const earned = badges.filter(badge => badge.user_badges[0]?.is_achieved);
      const available = badges.filter(badge => !badge.user_badges[0]?.is_achieved);

      setEarnedBadges(earned);
      setAvailableBadges(available);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBadgeRequirement = (badge) => {
    switch (badge.badge_types.id) {
      case 1: // Streak
        return userStats.streak >= badge.requirement;
      case 2: // Task
        return userStats.completedTasks >= badge.requirement;
      case 3: // Login
        return userStats.loginDays >= badge.requirement;
      default:
        return false;
    }
  };

  const claimBadge = async (badge) => {
    try {
      // Önce user_badges tablosuna kayıt ekle
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert([
          {
            user_id: user.id,
            badge_id: badge.id,
            is_achieved: true,
            achieved_at: new Date().toISOString()
          }
        ]);

      if (insertError) throw insertError;

      // Kullanıcının puanını güncelle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('achievement_points')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const newPoints = (profile.achievement_points || 0) + badge.points;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ achievement_points: newPoints })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setModalMessage(`${badge.badge_types.name} rozetini kazandınız! ${badge.points} puan kazandınız.`);
      setModalType('success');
      setShowModal(true);

      // Rozetleri yeniden yükle
      await fetchBadges();
    } catch (error) {
      console.error('Error claiming badge:', error);
      setModalMessage('Rozet alınırken bir hata oluştu. Lütfen tekrar deneyin.');
      setModalType('error');
      setShowModal(true);
    }
  };

  const filterBadges = (badges, type) => {
    if (!type) return badges;
    return badges.filter(badge => badge.badge_types.id === type);
  };

  const renderBadge = (badge, isEarned = false) => {
    const canClaim = !isEarned && checkBadgeRequirement(badge);
    
    return (
      <View
        key={badge.id}
        style={[
          styles.badgeItem,
          {
            backgroundColor: colors.card,
            borderColor: isEarned ? colors.success : (canClaim ? colors.primary : colors.border)
          }
        ]}
      >
        <MaterialCommunityIcons
          name={badge.icon}
          size={32}
          color={isEarned ? colors.success : (canClaim ? colors.primary : colors.subtext)}
        />
        <View style={styles.badgeInfo}>
          <Text style={[styles.badgeName, { color: colors.text }]}>
            {badge.badge_types.name} - Seviye {badge.level}
          </Text>
          <Text style={[styles.badgeDescription, { color: colors.subtext }]}>
            {badge.badge_types.description}
          </Text>
          <Text style={[styles.badgeRequirement, { color: colors.subtext }]}>
            Gereksinim: {badge.requirement}
          </Text>
          <Text style={[styles.badgePoints, { color: colors.primary }]}>
            {badge.points} Puan
          </Text>
        </View>
        {isEarned ? (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={colors.success}
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.claimButton,
              {
                backgroundColor: canClaim ? colors.primary : colors.border,
                opacity: canClaim ? 1 : 0.5
              }
            ]}
            onPress={() => canClaim && claimBadge(badge)}
            disabled={!canClaim}
          >
            <Text style={styles.claimButtonText}>
              {canClaim ? 'Al' : 'Kilitli'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderStatItem = (icon, value, label, type) => (
    <TouchableOpacity
      style={[
        styles.statItem,
        {
          backgroundColor: selectedType === type ? colors.primary : colors.card,
          borderColor: selectedType === type ? colors.primary : colors.border
        }
      ]}
      onPress={() => setSelectedType(type)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={24}
        color={selectedType === type ? '#fff' : colors.primary}
      />
      <Text style={[
        styles.statValue,
        { color: selectedType === type ? '#fff' : colors.text }
      ]}>
        {value}
      </Text>
      <Text style={[
        styles.statLabel,
        { color: selectedType === type ? '#fff' : colors.subtext }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { backgroundColor: colors.card }
        ]}>
          <MaterialCommunityIcons
            name={modalType === 'success' ? 'check-circle' : 'alert-circle'}
            size={48}
            color={modalType === 'success' ? colors.success : colors.error}
            style={styles.modalIcon}
          />
          <Text style={[styles.modalText, { color: colors.text }]}>
            {modalMessage}
          </Text>
          <TouchableOpacity
            style={[
              styles.modalButton,
              { backgroundColor: modalType === 'success' ? colors.success : colors.error }
            ]}
            onPress={() => setShowModal(false)}
          >
            <Text style={styles.modalButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const filteredEarnedBadges = filterBadges(earnedBadges, selectedType);
  const filteredAvailableBadges = filterBadges(availableBadges, selectedType);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderModal()}
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

      <ScrollView>
        <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
          {renderStatItem('fire', userStats.streak, 'Streak', 1)}
          {renderStatItem('check', userStats.completedTasks, 'Görev', 2)}
          {renderStatItem('calendar', userStats.loginDays, 'Gün', 3)}
        </View>

        {filteredEarnedBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Kazanılan Rozetler
            </Text>
            {filteredEarnedBadges.map(badge => renderBadge(badge, true))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Kazanılabilecek Rozetler
          </Text>
          {filteredAvailableBadges.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {selectedType ? 'Bu kategoride tüm rozetleri kazandınız!' : 'Tüm rozetleri kazandınız!'}
            </Text>
          ) : (
            filteredAvailableBadges.map(badge => renderBadge(badge))
          )}
        </View>
      </ScrollView>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  badgeDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  badgeRequirement: {
    fontSize: 12,
    marginBottom: 4,
  },
  badgePoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BadgesScreen; 