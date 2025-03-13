import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      setIsDarkMode(savedTheme === 'dark');
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
      setIsDarkMode(newTheme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  subtext: '#666666',
  border: '#eeeeee',
  primary: '#4CAF50',
  success: '#E8F5E9',
  successBorder: '#C8E6C9',
};

const darkColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  subtext: '#aaaaaa',
  border: '#333333',
  primary: '#81c784',
  success: '#1B5E20',
  successBorder: '#2E7D32',
}; 