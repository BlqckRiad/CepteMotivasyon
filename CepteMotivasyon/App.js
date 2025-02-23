import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, useTheme, configureFonts } from 'react-native-paper';
import {
  MD3LightTheme,
  MD3DarkTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { NotesScreen } from './screens/NotesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Özel tema yapılandırması
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    secondary: '#03A9F4',
    tertiary: '#4CAF50',
    error: '#F44336',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onSurface: '#000000',
    onBackground: '#000000',
    onSurfaceVariant: '#666666',
    elevation: {
      level0: 'transparent',
      level1: '#F5F5F5',
      level2: '#FFFFFF',
      level3: '#F5F5F5',
    },
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    secondary: '#81D4FA',
    tertiary: '#A5D6A7',
    error: '#EF9A9A',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onSurface: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#2C2C2C',
      level3: '#383838',
    },
  },
};

function MainTabs({ route }) {
  const { toggleTheme } = route.params || {};
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      initialRouteName="Ana Sayfa"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Ana Sayfa') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Notlar') {
            iconName = focused ? 'notebook' : 'notebook-outline';
          } else if (route.name === 'Ayarlar') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={focused ? size + 4 : size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onBackground,
      })}
    >
      <Tab.Screen 
        name="Notlar" 
        component={NotesScreen}
        options={{
          headerTitle: 'Notlarım',
        }}
      />
      <Tab.Screen 
        name="Ana Sayfa" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Ayarlar" 
        component={SettingsScreen}
        initialParams={{ toggleTheme }}
        options={{
          headerTitle: 'Ayarlar',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme === 'dark' ? customDarkTheme : customLightTheme);
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    checkFirstLaunch();
    loadThemePreference();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('onboardingCompleted');
      setIsFirstLaunch(hasLaunched === null);
    } catch (error) {
      setIsFirstLaunch(true);
    }
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme) {
        setTheme(savedTheme === 'dark' ? customDarkTheme : customLightTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === customLightTheme ? customDarkTheme : customLightTheme;
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme === customDarkTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  if (isFirstLaunch === null) {
    return null;
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isFirstLaunch ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              initialParams={{ toggleTheme }}
            />
          )}
        </Stack.Navigator>
        <StatusBar style={theme === customDarkTheme ? 'light' : 'dark'} />
      </NavigationContainer>
    </PaperProvider>
  );
}
