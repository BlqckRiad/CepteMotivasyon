import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../lib/ThemeContext';

const CustomHeader = ({ title, showNotification = true }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

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
          {showNotification && (
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: colors.background }]}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={colors.text} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          )}
        </View>
      </View>
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
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
});

export default CustomHeader; 