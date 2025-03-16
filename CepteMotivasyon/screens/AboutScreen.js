import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const AboutScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const appVersion = '1.0.0';

  // Ekran genişliği ve yüksekliği
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height; // Eğer genişlik yükseklikten büyükse yatay moddayız

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={isLandscape ? styles.landscapeContainer : {}}
    >
      <View style={[styles.content, isLandscape ? styles.landscapeContent : {}]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.header, { backgroundColor: colors.card, flexDirection: isLandscape ? 'row' : 'column', alignItems: isLandscape ? 'center' : 'flex-start' }]}>
          <Image
            source={require('../assets/app-icon.png')}
            style={[styles.appIcon, isLandscape ? styles.appIconLandscape : {}]}
          />
          <View style={isLandscape ? { marginLeft: 16 } : { alignItems: 'center' }}>
            <Text style={[styles.appName, { color: colors.text }]}>Cepte Motivasyon</Text>
            <Text style={[styles.version, { color: colors.subtext }]}>Versiyon {appVersion}</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Uygulama Hakkında</Text>
          <Text style={[styles.description, { color: colors.subtext }]}>
            Cepte Motivasyon, günlük hayatınızda motivasyonunuzu artırmak ve hedeflerinize ulaşmanıza yardımcı olmak için tasarlanmış bir uygulamadır.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Özellikler</Text>
          {["Günlük motivasyon görevleri", "Streak takip sistemi", "Başarı puanı sistemi", "Karanlık/Aydınlık tema desteği"].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>İletişim</Text>
          <Text style={[styles.contactText, { color: colors.subtext }]}>
            Uygulama ile ilgili her türlü soru, öneri ve geri bildirimleriniz için Yardım sayfasını kullanabilirsiniz.
          </Text>
        </View>

        <Text style={[styles.copyright, { color: colors.subtext }]}>
          © 2024 Cepte Motivasyon. Tüm hakları saklıdır.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  landscapeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  landscapeContent: {
    width: '90%',
  },
  backButton: {
    position: 'absolute',
    top: 26,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  header: {
    marginTop: 48,
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  appIconLandscape: {
    width: 80,
    height: 80,
    marginBottom: 0,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
  },
  contactText: {
    fontSize: 16,
    lineHeight: 24,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
  },
});

export default AboutScreen;
