import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

const MarketScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [achievementPoints, setAchievementPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [marketItems, setMarketItems] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchAllData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        fetchUserPoints(),
        fetchMarketItems(),
        fetchUserPurchases()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllData();
    });

    return unsubscribe;
  }, [navigation, user]);

  useEffect(() => {
    fetchAllData();
  }, [user]);

  const fetchUserPoints = async () => {
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

  const fetchMarketItems = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMarketItems(data || []);
    } catch (error) {
      console.error('Error fetching market items:', error);
    }
  };

  const fetchUserPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*, shop_items(*)')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setUserPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  const handlePurchase = async (item) => {
    if (achievementPoints < item.price) {
      Alert.alert('Yetersiz Puan', 'Bu çekilişe katılmak için yeterli puanınız bulunmuyor.');
      return;
    }

    try {
      // Kullanıcının puanını güncelle
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          achievement_points: achievementPoints - item.price
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Satın alma kaydını oluştur
      const { error: purchaseError } = await supabase
        .from('user_purchases')
        .insert([
          {
            user_id: user.id,
            item_id: item.id,
            purchase_date: new Date().toISOString()
          }
        ]);

      if (purchaseError) throw purchaseError;

      // Başarılı satın alma modalını göster
      setSelectedItem(item);
      setShowSuccessModal(true);

      // Verileri güncelle
      fetchUserPoints();
      fetchUserPurchases();
    } catch (error) {
      console.error('Error purchasing item:', error);
      Alert.alert('Hata', 'İşlem sırasında bir hata oluştu.');
    }
  };

  const renderMarketItem = (item) => {
    const canPurchase = achievementPoints >= item.price;
    const hasPurchased = userPurchases.some(purchase => purchase.item_id === item.id);
    const drawDate = new Date(item.draw_date).toLocaleDateString('tr-TR');

    return (
      <View
        key={item.id}
        style={[
          styles.itemCard,
          { 
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.itemImage}
          resizeMode="contain"
        />
        <View style={styles.itemContent}>
          <Text style={[styles.itemName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemDescription, { color: colors.subtext }]}>
            {item.description}
          </Text>
          <Text style={[styles.drawDate, { color: colors.primary }]}>
            Çekiliş Tarihi: {drawDate}
          </Text>
          <View style={styles.priceContainer}>
            <MaterialCommunityIcons
              name="star-circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {item.price} BP
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              {
                backgroundColor: hasPurchased 
                  ? colors.success 
                  : canPurchase 
                    ? colors.primary 
                    : colors.border,
                opacity: hasPurchased || canPurchase ? 1 : 0.6
              }
            ]}
            onPress={() => handlePurchase(item)}
            disabled={hasPurchased || !canPurchase}
          >
            <Text style={styles.purchaseButtonText}>
              {hasPurchased ? 'Katıldınız' : canPurchase ? 'Katıl' : 'Yetersiz Puan'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Market
        </Text>
      </View>

      <View style={[styles.balanceContainer, { backgroundColor: colors.card }]}>
        <MaterialCommunityIcons
          name="star-circle"
          size={24}
          color={colors.primary}
        />
        <Text style={[styles.balanceText, { color: colors.text }]}>
          {achievementPoints} BP
        </Text>
      </View>

      <View style={[styles.infoContainer, { backgroundColor: colors.primary + '15' }]}>
        <MaterialCommunityIcons
          name="information"
          size={24}
          color={colors.primary}
          style={styles.infoIcon}
        />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Kazandığınız başarı puanlarını (BP) çekilişlere katılmak için kullanabilirsiniz. 
          Çekiliş sonuçları belirtilen tarihlerde açıklanacaktır.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.suggestionButton, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('Help')}
      >
        <MaterialCommunityIcons
          name="lightbulb-outline"
          size={24}
          color={colors.primary}
          style={styles.suggestionIcon}
        />
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          Firma öneriniz mi var?
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.subtext}
        />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {marketItems.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Şu anda aktif çekiliş bulunmuyor.
          </Text>
        ) : (
          marketItems.map(renderMarketItem)
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSuccessModal(false)}
        >
          <View style={[styles.successModalContent, { backgroundColor: colors.card }]}>
            <View style={styles.successIconContainer}>
              <MaterialCommunityIcons
                name="check-circle"
                size={64}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              Tebrikler!
            </Text>
            <Text style={[styles.successText, { color: colors.text }]}>
              {selectedItem?.name} çekilişine başarıyla katıldınız.
            </Text>
            <Text style={[styles.successSubText, { color: colors.subtext }]}>
              Çekiliş sonuçları 06.01.2025 tarihinde açıklanacaktır.
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowSuccessModal(false)}
            >
              <Text style={styles.successButtonText}>Tamam</Text>
            </TouchableOpacity>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },
  itemCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    resizeMode: 'contain',
    aspectRatio: 1.5,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    padding: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  drawDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  purchaseButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
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
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  successSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  successButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MarketScreen; 