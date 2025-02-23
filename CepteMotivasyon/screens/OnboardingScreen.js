import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, Dimensions, Animated, useWindowDimensions } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { onboardingSlides } from '../data/veri';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0]?.index ?? 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = async () => {
    if (currentIndex < onboardingSlides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem('onboardingCompleted', 'true');
        // Ana ekrana yönlendirme
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } catch (err) {
        console.log('Error @setItem: ', err);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    slide: {
      flex: 1,
      width,
      flexDirection: isLandscape ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    iconContainer: {
      flex: isLandscape ? 0.5 : 0.7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      marginBottom: isLandscape ? 0 : 20,
    },
    textContainer: {
      flex: isLandscape ? 0.5 : 0.3,
      justifyContent: 'center',
      paddingHorizontal: isLandscape ? 20 : 0,
    },
    title: {
      fontSize: isLandscape ? 24 : 28,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      color: theme.colors.primary,
    },
    description: {
      fontSize: isLandscape ? 14 : 16,
      textAlign: 'center',
      color: theme.colors.secondary,
      paddingHorizontal: 20,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: height * (isLandscape ? 0.2 : 0.15),
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: isLandscape ? 10 : 20,
      backgroundColor: theme.colors.background,
    },
    pagination: {
      flexDirection: 'row',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    paginationDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 5,
    },
    button: {
      width: isLandscape ? width * 0.4 : width * 0.8,
      alignSelf: 'center',
      marginBottom: isLandscape ? 5 : 20,
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={onboardingSlides}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={item.icon}
                size={isLandscape ? 100 : 150}
                color={theme.colors.primary}
                style={styles.icon}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {onboardingSlides.map((_, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                style={[
                  styles.paginationDot,
                  {
                    width: dotWidth,
                    opacity,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                key={index.toString()}
              />
            );
          })}
        </View>
        <Button
          mode="contained"
          onPress={scrollTo}
          style={styles.button}
        >
          {currentIndex === onboardingSlides.length - 1 ? 'Başla' : 'Devam Et'}
        </Button>
      </View>
    </View>
  );
}; 