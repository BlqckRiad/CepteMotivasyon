import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const EducationScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('education_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContentPress = (url) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : colors.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? '#000' : colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? '#000' : colors.background }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            İçerikler yüklenirken bir hata oluştu
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchContent}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000' : colors.background }]}>
      <ScrollView
        style={[styles.contentContainer, { backgroundColor: isDarkMode ? '#000' : colors.background }]}
        contentContainerStyle={styles.contentList}
      >
        {content.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.contentCard,
              { 
                backgroundColor: isDarkMode ? '#1A1A1A' : colors.card,
                borderColor: isDarkMode ? '#333' : colors.border,
              }
            ]}
            onPress={() => handleContentPress(item.content_url)}
          >
            <View style={styles.contentImageContainer}>
              <Image
                source={{ uri: item.image_url }}
                style={styles.contentImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.contentInfo}>
              <Text style={[styles.contentTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.contentDescription, { color: colors.subtext }]}>
                {item.description}
              </Text>
              <View style={styles.contentMeta}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={colors.subtext}
                />
                <Text style={[styles.contentDuration, { color: colors.subtext }]}>
                  {item.duration}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  contentList: {
    padding: 16,
  },
  contentCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
  contentImageContainer: {
    height: isTablet ? 200 : 160,
    position: 'relative',
  },
  contentImage: {
    width: '100%',
    height: '100%',
  },
  contentInfo: {
    padding: 16,
  },
  contentTitle: {
    fontSize: isTablet ? 20 : 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: isTablet ? 16 : 14,
    marginBottom: 12,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentDuration: {
    marginLeft: 4,
    fontSize: 12,
  },
});

export default EducationScreen;