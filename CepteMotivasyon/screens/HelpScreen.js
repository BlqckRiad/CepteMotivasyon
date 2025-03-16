import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

const HelpScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('feedback');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const messageTypes = [
    { id: 'feedback', label: 'Geri Bildirim', icon: 'message-text' },
    { id: 'suggestion', label: 'Öneri', icon: 'lightbulb' },
    { id: 'complaint', label: 'Şikayet', icon: 'alert' }
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('contact')
        .insert([
          {
            user_id: user.id,
            subject: subject.trim(),
            message: message.trim(),
            type: type
          }
        ]);

      if (error) throw error;

      setSubject('');
      setMessage('');
      setType('feedback');
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert('Hata', 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
      console.error('Error submitting contact form:', error);
    } finally {
      setLoading(false);
    }
  };

  const SuccessModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showSuccessModal}
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalIcon}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Başarıyla Gönderildi!</Text>
          <Text style={[styles.modalText, { color: colors.subtext }]}>
            En kısa sürede size dönüş yapacağız.
          </Text>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.goBack();
            }}
          >
            <Text style={styles.modalButtonText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <MaterialCommunityIcons name="help-circle" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Size Nasıl Yardımcı Olabiliriz?</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            Öneri, şikayet veya geri bildirimlerinizi bizimle paylaşın.
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mesaj Türü</Text>
            <View style={styles.typeContainer}>
              {messageTypes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: type === item.id ? colors.primary : colors.background,
                      borderColor: type === item.id ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setType(item.id)}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={24}
                    color={type === item.id ? '#fff' : colors.text}
                  />
                  <Text style={[
                    styles.typeText,
                    { color: type === item.id ? '#fff' : colors.text }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Konu</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Konu başlığı"
              placeholderTextColor={colors.subtext}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mesajınız</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              placeholder="Mesajınızı buraya yazın..."
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Gönder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <SuccessModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  formContainer: {
    padding: 16,
    borderRadius: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
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
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HelpScreen; 