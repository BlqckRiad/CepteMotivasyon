import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Platform, useWindowDimensions, TouchableOpacity, Dimensions } from 'react-native';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import { AuthProvider, useAuth } from './lib/AuthContext';

// Import screens
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';
import CustomHeader from './components/CustomHeader';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Tablet boyutları için yardımcı fonksiyon
const getTabletDimensions = () => {
  const windowDimensions = Dimensions.get('window');
  return {
    isTablet: windowDimensions.width >= 768,
    width: windowDimensions.width,
    height: windowDimensions.height,
  };
};

const TabBarIcon = ({ focused, icon, label, onPress, disabled }) => {
  const { isTablet } = getTabletDimensions();
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.tabBarItem,
        disabled && styles.tabBarItemDisabled,
        { backgroundColor: colors.card }
      ]} 
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[
        styles.iconWrapper,
        focused && [styles.iconWrapperFocused, { backgroundColor: colors.success }],
        disabled && styles.iconWrapperDisabled
      ]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={isTablet ? 28 : 24} 
          color={disabled ? colors.border : (focused ? colors.primary : colors.subtext)} 
        />
      </View>
      <View style={styles.labelContainer}>
        <Text style={[
          styles.tabLabel,
          { color: colors.subtext },
          focused && [styles.tabLabelFocused, { color: colors.primary }],
          isTablet && styles.tabLabelTablet,
          disabled && styles.tabLabelDisabled
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AuthRequiredScreen = ({ navigation }) => {
  const { isTablet } = getTabletDimensions();
  const { colors } = useTheme();

  return (
    <View style={[styles.authRequiredContainer, { backgroundColor: colors.background }]}>
      <MaterialCommunityIcons name="account-lock" size={isTablet ? 80 : 64} color={colors.subtext} />
      <Text style={[
        styles.authRequiredTitle,
        { color: colors.text },
        isTablet && styles.authRequiredTitleTablet
      ]}>
        Giriş Yapmanız Gerekiyor
      </Text>
      <Text style={[
        styles.authRequiredText,
        { color: colors.subtext },
        isTablet && styles.authRequiredTextTablet
      ]}>
        Bu sayfayı görüntülemek için lütfen giriş yapın veya hesap oluşturun.
      </Text>
      <TouchableOpacity
        style={[
          styles.authRequiredButton,
          { backgroundColor: colors.primary },
          isTablet && styles.authRequiredButtonTablet
        ]}
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={[styles.authRequiredButtonText, isTablet && styles.authRequiredButtonTextTablet]}>
          Giriş Yap
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const TabNavigator = () => {
  const { isTablet, width, height } = getTabletDimensions();
  const isLandscape = width > height;
  const { user } = useAuth();
  const { colors } = useTheme();

  const getTabBarStyle = () => {
    const baseStyle = {
      backgroundColor: colors.card,
      borderTopWidth: 0,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      height: Platform.OS === 'ios' ? (isTablet ? 85 : 80) : (isTablet ? 75 : 70),
      paddingBottom: Platform.OS === 'ios' ? 20 : 10,
      paddingTop: 8,
      paddingHorizontal: 10,
    };

    if (isTablet) {
      return {
        ...baseStyle,
        maxWidth: isLandscape ? '60%' : '100%',
        marginHorizontal: isLandscape ? '20%' : 0,
      };
    }

    return baseStyle;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        header: ({ route }) => {
          let title = '';
          switch (route.name) {
            case 'Home':
              title = 'Motivasyon';
              break;
            case 'Profile':
              title = 'Profilim';
              break;
            case 'Settings':
              title = 'Ayarlar';
              break;
          }
          return <CustomHeader title={title} />;
        },
        tabBarStyle: getTabBarStyle(),
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} icon="home" label="Ana Sayfa" onPress={() => navigation.navigate('Home')} />
          ),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={user ? ProfileScreen : AuthRequiredScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused} 
              icon="account" 
              label="Profil" 
              onPress={() => user ? navigation.navigate('Profile') : navigation.navigate('Auth')}
              disabled={!user}
            />
          ),
        })}
      />
      <Tab.Screen
        name="Settings"
        component={user ? SettingsScreen : AuthRequiredScreen}
        options={({ navigation }) => ({
          tabBarIcon: ({ focused }) => (
            <TabBarIcon 
              focused={focused} 
              icon="cog" 
              label="Ayarlar" 
              onPress={() => user ? navigation.navigate('Settings') : navigation.navigate('Auth')}
              disabled={!user}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen 
        name="Auth" 
        component={AuthScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    minWidth: 80,
  },
  tabBarItemDisabled: {
    opacity: 0.7,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconWrapperFocused: {
    backgroundColor: '#E8F5E9',
  },
  iconWrapperDisabled: {
    backgroundColor: '#f5f5f5',
  },
  labelContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelFocused: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabLabelDisabled: {
    color: '#ccc',
  },
  tabLabelTablet: {
    fontSize: 14,
  },
  authRequiredContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  authRequiredTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  authRequiredTitleTablet: {
    fontSize: 24,
  },
  authRequiredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  authRequiredTextTablet: {
    fontSize: 18,
    maxWidth: 400,
  },
  authRequiredButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
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
  authRequiredButtonTablet: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  authRequiredButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authRequiredButtonTextTablet: {
    fontSize: 18,
  },
});
