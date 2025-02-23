import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Text, Surface, IconButton, ProgressBar, useTheme } from 'react-native-paper';
import { gunlukGorevler } from '../data/veri';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const HomeScreen = () => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const [dailyQuote, setDailyQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [streak, setStreak] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    completed: 0,
    total: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState({
    completed: 0,
    total: 0,
  });
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    loadDailyContent();
    loadCompletedTasks();
    loadStatistics();
  }, []);

  const loadDailyContent = async () => {
    setIsLoading(true);
    try {
      // Firestore'dan motivasyon sözlerini çek
      const quotesCollection = collection(db, 'MotivasyonSozleri');
      const quotesSnapshot = await getDocs(quotesCollection)
        .catch(error => {
          console.error('Firestore error:', error);
          throw error;
        });

      const quotes = quotesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Fetched quotes:', quotes); // Debug için

      // Rastgele bir söz seç
      if (quotes.length > 0) {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setDailyQuote({
          text: randomQuote.MotivasyonSoz || 'Başarı, her gün küçük adımlar atmaktır.',
          author: randomQuote.KimYazdi || 'Cepte Motivasyon'
        });
      } else {
        // Veri yoksa varsayılan değeri göster
        setDailyQuote({
          text: "Başarı, her gün küçük adımlar atmaktır.",
          author: "Cepte Motivasyon"
        });
      }

      // Rastgele 3-5 görev seçimi
      const taskCount = Math.floor(Math.random() * 3) + 3;
      const shuffledTasks = [...gunlukGorevler].sort(() => 0.5 - Math.random());
      const selectedTasks = shuffledTasks.slice(0, taskCount);
      setTasks(selectedTasks);
    } catch (error) {
      console.error('Error loading daily content:', error);
      // Hata durumunda varsayılan bir söz göster
      setDailyQuote({
        text: "Başarı, her gün küçük adımlar atmaktır.",
        author: "Cepte Motivasyon"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompletedTasks = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedTasks');
      if (completed) {
        setCompletedTasks(new Set(JSON.parse(completed)));
      }
    } catch (error) {
      console.error('Error loading completed tasks:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      // Streak'i yükle
      const savedStreak = await AsyncStorage.getItem('streak');
      const lastCompletionDate = await AsyncStorage.getItem('lastCompletionDate');
      const today = new Date().toDateString();

      if (savedStreak && lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString() || lastDate.toDateString() === today) {
          setStreak(parseInt(savedStreak));
        } else {
          setStreak(0);
          await AsyncStorage.setItem('streak', '0');
        }
      }

      // Haftalık ve aylık istatistikleri yükle
      const now = new Date();
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const allCompletedTasks = await AsyncStorage.getItem('allCompletedTasks');
      const parsedTasks = allCompletedTasks ? JSON.parse(allCompletedTasks) : [];

      const weeklyCompleted = parsedTasks.filter(task => new Date(task.date) >= startOfWeek).length;
      const monthlyCompleted = parsedTasks.filter(task => new Date(task.date) >= startOfMonth).length;

      setWeeklyStats({
        completed: weeklyCompleted,
        total: weeklyCompleted + tasks.length,
      });

      setMonthlyStats({
        completed: monthlyCompleted,
        total: monthlyCompleted + tasks.length,
      });

      // Başarı rozetlerini kontrol et ve güncelle
      checkAchievements(weeklyCompleted, monthlyCompleted, parseInt(savedStreak || '0'));
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const checkAchievements = (weeklyCompleted, monthlyCompleted, currentStreak) => {
    const newAchievements = [];

    if (weeklyCompleted >= 5) {
      newAchievements.push({
        id: 'weekly5',
        title: 'Haftalık Başarı',
        icon: 'star',
        description: 'Bu hafta 5 görev tamamladınız!',
      });
    }

    if (monthlyCompleted >= 20) {
      newAchievements.push({
        id: 'monthly20',
        title: 'Aylık Başarı',
        icon: 'trophy',
        description: 'Bu ay 20 görev tamamladınız!',
      });
    }

    if (currentStreak >= 3) {
      newAchievements.push({
        id: 'streak3',
        title: 'Süreklilik',
        icon: 'fire',
        description: '3 gün üst üste görev tamamladınız!',
      });
    }

    setAchievements(newAchievements);
  };

  const toggleTaskCompletion = async (taskId) => {
    const newCompletedTasks = new Set(completedTasks);
    const isCompleting = !newCompletedTasks.has(taskId);

    if (isCompleting) {
      newCompletedTasks.add(taskId);
      
      // Streak ve son tamamlama tarihini güncelle
      const today = new Date();
      await AsyncStorage.setItem('lastCompletionDate', today.toISOString());
      
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('streak', newStreak.toString());

      // Tamamlanan görevi kaydet
      const allCompletedTasks = await AsyncStorage.getItem('allCompletedTasks');
      const parsedTasks = allCompletedTasks ? JSON.parse(allCompletedTasks) : [];
      parsedTasks.push({
        taskId,
        date: today.toISOString(),
      });
      await AsyncStorage.setItem('allCompletedTasks', JSON.stringify(parsedTasks));
    } else {
      newCompletedTasks.delete(taskId);
    }

    setCompletedTasks(newCompletedTasks);
    await AsyncStorage.setItem('completedTasks', JSON.stringify([...newCompletedTasks]));
    loadStatistics(); // İstatistikleri güncelle
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: isTablet ? 32 : 16,
    },
    header: {
      marginBottom: 24,
    },
    welcomeText: {
      fontSize: isTablet ? 32 : 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    dateText: {
      fontSize: isTablet ? 18 : 16,
      color: theme.colors.secondary,
    },
    quoteSurface: {
      marginBottom: 24,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 16,
      borderRadius: 12,
    },
    quoteIcon: {
      marginBottom: 8,
    },
    quoteText: {
      fontSize: isTablet ? 20 : 18,
      color: theme.colors.onSurface,
      fontStyle: 'italic',
      marginBottom: 8,
      lineHeight: 24,
    },
    authorText: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.secondary,
      textAlign: 'right',
    },
    tasksHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    tasksTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressText: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginBottom: 4,
    },
    taskSurface: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 12,
    },
    completedTaskSurface: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    taskContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    taskText: {
      flex: 1,
      fontSize: isTablet ? 18 : 16,
      color: theme.colors.onSurface,
      marginRight: 16,
    },
    completedTaskText: {
      textDecorationLine: 'line-through',
      color: theme.colors.secondary,
    },
    statsContainer: {
      marginTop: 24,
      marginBottom: 16,
    },
    statsHeader: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    statsSurface: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    statsLabel: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.onSurfaceVariant,
    },
    statsValue: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    achievementsContainer: {
      marginTop: 8,
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    achievementIcon: {
      marginRight: 8,
    },
    achievementText: {
      fontSize: isTablet ? 14 : 12,
      color: theme.colors.onSurfaceVariant,
    },
  });

  const progress = tasks.length > 0 ? completedTasks.size / tasks.length : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Merhaba!</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {dailyQuote && (
        <Surface style={styles.quoteSurface} elevation={0}>
          <MaterialCommunityIcons
            name="format-quote-open"
            size={24}
            color={theme.colors.primary}
            style={styles.quoteIcon}
          />
          <Text style={styles.quoteText}>{dailyQuote.text}</Text>
          <Text style={styles.authorText}>- {dailyQuote.author}</Text>
        </Surface>
      )}

      <View style={styles.tasksHeader}>
        <Text style={styles.tasksTitle}>Günün Görevleri</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={loadDailyContent}
        />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {completedTasks.size} / {tasks.length} görev tamamlandı
        </Text>
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={{ height: 8, borderRadius: 4 }}
        />
      </View>

      {tasks.map((task) => (
        <Pressable
          key={task.id}
          onPress={() => toggleTaskCompletion(task.id)}
        >
          <Surface
            style={[
              styles.taskSurface,
              completedTasks.has(task.id) && styles.completedTaskSurface
            ]}
            elevation={0}
          >
            <View style={styles.taskContent}>
              <Text style={[
                styles.taskText,
                completedTasks.has(task.id) && styles.completedTaskText
              ]}>
                {task.description}
              </Text>
              {completedTasks.has(task.id) && (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={24}
                  color={theme.colors.tertiary}
                />
              )}
            </View>
          </Surface>
        </Pressable>
      ))}

      <View style={styles.statsContainer}>
        <Text style={styles.statsHeader}>İstatistikler</Text>
        
        <Surface style={styles.statsSurface} elevation={0}>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Streak</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="fire" size={24} color={theme.colors.primary} />
              <Text style={[styles.statsValue, { marginLeft: 8 }]}>{streak} gün</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Bu Hafta</Text>
            <Text style={styles.statsValue}>
              {weeklyStats.completed}/{weeklyStats.total} görev
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Bu Ay</Text>
            <Text style={styles.statsValue}>
              {monthlyStats.completed}/{monthlyStats.total} görev
            </Text>
          </View>
        </Surface>

        {achievements.length > 0 && (
          <Surface style={styles.statsSurface} elevation={0}>
            <Text style={[styles.statsLabel, { marginBottom: 12 }]}>Başarılar</Text>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <MaterialCommunityIcons
                    name={achievement.icon}
                    size={20}
                    color={theme.colors.primary}
                    style={styles.achievementIcon}
                  />
                  <Text style={styles.achievementText}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </Surface>
        )}
      </View>
    </ScrollView>
  );
}; 