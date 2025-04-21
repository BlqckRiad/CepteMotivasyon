import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import CustomHeader from '../components/CustomHeader';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const FAQItem = ({ question, answer, isOpen, onToggle, colors }) => {
  return (
    <View style={[styles.faqItem, { borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.questionContainer, { backgroundColor: colors.card }]}
        onPress={onToggle}
      >
        <Text style={[styles.questionText, { color: colors.text }]}>
          {question}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.answerContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.answerText, { color: colors.subtext }]}>
            {answer}
          </Text>
        </View>
      )}
    </View>
  );
};

const FAQScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      question: 'Uygulamayı nasıl kullanabilirim?',
      answer: 'Uygulamayı kullanmaya başlamak için öncelikle bir hesap oluşturmanız gerekiyor. Ardından günlük görevlerinizi takip edebilir, başarı rozetleri kazanabilir ve motivasyon içeriklerine erişebilirsiniz.'
    },
    {
      question: 'Başarı rozetleri nasıl kazanılır?',
      answer: 'Başarı rozetleri, belirli hedefleri gerçekleştirdiğinizde otomatik olarak kazanılır. Örneğin, art arda 7 gün görevlerinizi tamamladığınızda "Kararlı" rozetini kazanırsınız.'
    },
    {
      question: 'Bildirimler nasıl özelleştirilir?',
      answer: 'Ayarlar menüsünden bildirim tercihlerinizi düzenleyebilirsiniz. Günlük hatırlatıcıları açıp kapatabilir ve bildirim saatlerini kendinize göre ayarlayabilirsiniz.'
    },
    {
      question: 'Market puanları nasıl kazanılır?',
      answer: 'Market puanları, günlük görevlerinizi tamamlayarak ve başarı rozetleri kazanarak elde edilir. Bu puanları markette çeşitli ödüller için kullanabilirsiniz.'
    },
    {
      question: 'Şifremi unuttum, ne yapmalıyım?',
      answer: 'Giriş ekranındaki "Şifremi Unuttum" seçeneğini kullanarak e-posta adresinize sıfırlama bağlantısı gönderebilirsiniz.'
    },
    {
      question: 'Hesabımı nasıl silebilirim?',
      answer: 'Hesabınızı silmek için Ayarlar > Hesap > Hesabı Sil yolunu izleyebilirsiniz. Bu işlem geri alınamaz, tüm verileriniz kalıcı olarak silinecektir.'
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Sık Sorulan Sorular
        </Text>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {faqData.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              colors={colors}
            />
          ))}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  faqItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionText: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  answerContainer: {
    padding: 16,
    paddingTop: 0,
  },
  answerText: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: 22,
  },
});

export default FAQScreen; 