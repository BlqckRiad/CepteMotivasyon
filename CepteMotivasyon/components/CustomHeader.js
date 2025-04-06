import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const CustomHeader = ({ title, showNotification = true }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const fetchUserPoints = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('achievement_points')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAchievementPoints(data.achievement_points || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  useEffect(() => {
    fetchUserPoints();
  }, [user]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserPoints();
    });

    return unsubscribe;
  }, [navigation, user]);

  return (
    <View style={[
      styles.headerContainer,
      { backgroundColor: colors.background }
    ]}>
      <View style={[
        styles.header,
        { paddingTop: insets.top, backgroundColor: colors.card }
      ]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.logo}>🌟</Text>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          </View>
          {user && (
            <TouchableOpacity 
              style={styles.pointsContainer}
              onPress={() => setShowModal(true)}
            >
              <MaterialCommunityIcons name="trophy" size={20} color={colors.primary} />
              <Text style={[styles.points, { color: colors.text }]}>{achievementPoints} BP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="trophy" size={24} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Başarı Puanı (BP) Nedir?</Text>
            </View>
            <Text style={[styles.modalText, { color: colors.text }]}>
              Başarı Puanı (BP), uygulamadaki aktiviteleriniz ve başarılarınız sonucunda kazandığınız puanlardır. 
              Bu puanları Market bölümünde çeşitli ürünler ve indirim kuponları için kullanabilirsiniz.
            </Text>
            <Text style={[styles.modalSubText, { color: colors.subtext }]}>
              • Günlük görevleri tamamlayarak{'\n'}
              • Rozetler kazanarak{'\n'}
              • Düzenli uygulama kullanımıyla{'\n'}
              BP kazanabilirsiniz.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    overflow: 'hidden',
  },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  points: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  modalSubText: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default CustomHeader; 