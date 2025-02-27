import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomHeader() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#6C63FF" />
      <LinearGradient
        colors={['#6C63FF', '#4CAF50']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Image
              source={require('../assets/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Cepte Motivasyon</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#6C63FF',
    width: '100%',
  },
  gradient: {
    width: '100%',
  },
  headerContainer: {
    height: Platform.OS === 'ios' ? 44 : 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    margin:8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: Platform.OS === 'ios' ? 28 : 32,
    height: Platform.OS === 'ios' ? 28 : 32,
    marginRight: 8,
  },
  title: {
    color: '#FFF',
    fontSize: Platform.OS === 'ios' ? 18 : 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 