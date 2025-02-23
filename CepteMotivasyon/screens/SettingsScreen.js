import React from 'react';
import { View, StyleSheet, Share, Linking, Platform, ScrollView } from 'react-native';
import { List, Switch, Divider, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen = ({ route, navigation }) => {
  const { toggleTheme } = route.params || {};
  const theme = useTheme();

  const shareApp = async () => {
    try {
      await Share.share({
        message: 'CepteMotivasyon uygulamasını deneyin! Her gün yeni motivasyon ve kişisel gelişim için: [App Store/Play Store linki]',
      });
    } catch (error) {
      console.error('Error sharing app:', error);
    }
  };

  const rateApp = () => {
    const storeUrl = Platform.OS === 'ios'
      ? '[App Store linki]'
      : '[Play Store linki]';
    Linking.openURL(storeUrl);
  };

  const resetApp = async () => {
    try {
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch (error) {
      console.error('Error resetting app:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginBottom: 8,
    },
    divider: {
      backgroundColor: theme.colors.surfaceVariant,
      marginVertical: 8,
    },
    deleteText: {
      color: theme.colors.error,
    },
  });

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <List.Section style={styles.section}>
        <List.Subheader>Görünüm</List.Subheader>
        <List.Item
          title="Karanlık Mod"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={theme.dark}
              onValueChange={toggleTheme}
            />
          )}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section style={styles.section}>
        <List.Subheader>Uygulama</List.Subheader>
        <List.Item
          title="Uygulamayı Paylaş"
          left={props => <List.Icon {...props} icon="share" />}
          onPress={shareApp}
        />
        <List.Item
          title="Uygulamayı Değerlendir"
          left={props => <List.Icon {...props} icon="star" />}
          onPress={rateApp}
        />
        <List.Item
          title="Uygulama Hakkında"
          left={props => <List.Icon {...props} icon="information" />}
          description="Versiyon 1.0.0"
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section style={styles.section}>
        <List.Subheader>Veri ve Gizlilik</List.Subheader>
        <List.Item
          title="Tüm Verileri Temizle"
          titleStyle={styles.deleteText}
          left={props => <List.Icon {...props} icon="delete" color={theme.colors.error} />}
          onPress={resetApp}
        />
      </List.Section>
    </ScrollView>
  );
}; 