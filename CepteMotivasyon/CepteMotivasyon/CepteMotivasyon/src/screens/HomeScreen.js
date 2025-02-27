import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  SafeAreaView,
  Animated,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { NotificationService } from '../services/NotificationService';

const CelebrationModal = ({ visible, onClose }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(animation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => onClose());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.celebrationContainer,
        {
          opacity: animation,
          transform: [
            {
              scale: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
            },
          ],
        },
      ]}
    >
      <LottieView
        source={require('../assets/animations/celebration.json')}
        autoPlay
        loop={false}
        style={styles.celebrationAnimation}
      />
      <Text style={styles.celebrationTitle}>Tebrikler!</Text>
      <Text style={styles.celebrationText}>
        Bugünün tüm görevlerini tamamladınız! 🎉
      </Text>
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [quote, setQuote] = useState(null);
  const [dailyTasks, setDailyTasks] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const { user } = useAuth();
  const isTablet = width > 768;

  const fetchRandomQuote = async () => {
    try {
      let { count } = await supabase
        .from('quotes')
        .select('*', { count: 'exact' });

      const randomIndex = Math.floor(Math.random() * count);
      
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .range(randomIndex, randomIndex)
        .single();

      if (error) throw error;
      setQuote(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
  };

  const fetchOrCreateDailyTasks = async () => {
    if (!user) {
      setDailyTasks(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Önce bugünün görevlerini kontrol et
      const { data: existingTasks, error: existingError } = await supabase
        .from('completed_tasks')
        .select(`
          completed_task_id,
          user_id,
          task1_id,
          task2_id,
          task3_id,
          task4_id,
          task5_id,
          task1_completed,
          task2_completed,
          task3_completed,
          task4_completed,
          task5_completed,
          created_date,
          tasks1:tasks!task1_id(id, taskname, taskicon),
          tasks2:tasks!task2_id(id, taskname, taskicon),
          tasks3:tasks!task3_id(id, taskname, taskicon),
          tasks4:tasks!task4_id(id, taskname, taskicon),
          tasks5:tasks!task5_id(id, taskname, taskicon)
        `)
        .eq('user_id', user.id)
        .eq('created_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      // Eğer görev varsa direkt onu kullan
      if (existingTasks) {
        setDailyTasks(existingTasks);
        return;
      }
      
      // 2. Görev yoksa, rastgele 5 görev seç
      const { data: randomTasks, error: randomError } = await supabase
        .from('tasks')
        .select('id')
        .limit(5)
        .order('created_at', { ascending: false });
       
      if (randomError) throw randomError;

      // 3. Yeni görevleri oluştur
      const { data: newTask, error: insertError } = await supabase
        .from('completed_tasks')
        .insert({
          user_id: user.id,
          task1_id: randomTasks[0].id,
          task2_id: randomTasks[1].id,
          task3_id: randomTasks[2].id,
          task4_id: randomTasks[3].id,
          task5_id: randomTasks[4].id,
          created_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Yeni oluşturulan görevlerin detaylarını al
      const { data: createdTasks, error: detailsError } = await supabase
        .from('completed_tasks')
        .select(`
          completed_task_id,
          user_id,
          task1_id,
          task2_id,
          task3_id,
          task4_id,
          task5_id,
          task1_completed,
          task2_completed,
          task3_completed,
          task4_completed,
          task5_completed,
          created_date,
          tasks1:tasks!task1_id(id, taskname, taskicon),
          tasks2:tasks!task2_id(id, taskname, taskicon),
          tasks3:tasks!task3_id(id, taskname, taskicon),
          tasks4:tasks!task4_id(id, taskname, taskicon),
          tasks5:tasks!task5_id(id, taskname, taskicon)
        `)
        .eq('completed_task_id', newTask.completed_task_id)
        .single();

      if (detailsError) throw detailsError;

      setDailyTasks(createdTasks);
    } catch (error) {
      console.error('Error fetching/creating daily tasks:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompletion = async (taskNumber, isCompleted) => {
    if (!user || !dailyTasks) return;

    try {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      const { error } = await supabase.rpc('update_task_completion', {
        p_completed_task_id: dailyTasks.completed_task_id,
        p_task_number: taskNumber,
        p_is_completed: !isCompleted
      });

      if (error) throw error;

      // Yerel state'i güncelle
      const updatedTasks = {
        ...dailyTasks,
        [`task${taskNumber}_completed`]: !isCompleted
      };
      setDailyTasks(updatedTasks);

      // Tüm görevler tamamlandı mı kontrol et
      const allTasksCompleted = [1, 2, 3, 4, 5].every(
        num => updatedTasks[`task${num}_completed`]
      );

      if (allTasksCompleted && !isCompleted) {
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRandomQuote(), fetchOrCreateDailyTasks()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchRandomQuote(), fetchOrCreateDailyTasks()]);
      setLoading(false);
    };
    loadData();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  const completedTaskCount = dailyTasks
    ? Object.keys(dailyTasks)
        .filter(key => key.endsWith('_completed'))
        .reduce((count, key) => count + (dailyTasks[key] ? 1 : 0), 0)
    : 0;

  const renderTask = (taskNumber) => {
    if (!dailyTasks) return null;
    const task = dailyTasks[`tasks${taskNumber}`];
    const isCompleted = dailyTasks[`task${taskNumber}_completed`];

    return (
      <TouchableOpacity
        key={taskNumber}
        style={[
          styles.taskItem,
          isCompleted && styles.completedTask
        ]}
        onPress={() => handleTaskCompletion(taskNumber, isCompleted)}
      >
        <View style={styles.taskIconContainer}>
          <Text style={styles.taskIcon}>{task.taskicon}</Text>
          {isCompleted && (
            <View style={styles.checkmarkContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
        </View>
        <Text style={[
          styles.taskName,
          isCompleted && styles.completedTaskText
        ]}>
          {task.taskname}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.content, isTablet && styles.tabletContent]}>
          <View style={[styles.quoteContainer, isTablet && styles.tabletQuoteContainer]}>
            <View style={styles.quoteHeader}>
              <Text style={styles.quoteTitle}>Günün İlham Veren Sözü</Text>
              <TouchableOpacity onPress={fetchRandomQuote} style={styles.refreshButton}>
                <Ionicons name="refresh-circle" size={32} color="#6C63FF" />
              </TouchableOpacity>
            </View>
            {quote && (
              <LinearGradient
                colors={['#6C63FF20', '#4CAF5020']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quoteContent}
              >
                <Text style={styles.quoteText}>"{quote.gununsozu}"</Text>
                <Text style={styles.quoteAuthor}>- {quote.sozunsahibi}</Text>
              </LinearGradient>
            )}
          </View>

          <View style={[styles.tasksContainer, isTablet && styles.tabletTasksContainer]}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>Bugünün Görevleri</Text>
              {user && dailyTasks && (
                <View style={styles.taskProgress}>
                  <Text style={styles.taskProgressText}>
                    {completedTaskCount}/5 Tamamlandı
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${(completedTaskCount / 5) * 100}%` }
                    ]} />
                  </View>
                </View>
              )}
            </View>
            
            {!user ? (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Auth')}
                style={styles.authBanner}
              >
                <View style={styles.authBannerContent}>
                  <Text style={styles.authBannerTitle}>
                    Giriş Yapmanız Gerekiyor
                  </Text>
                  <Text style={styles.authBannerText}>
                    Günlük görevleri görmek için lütfen giriş yapın veya kayıt olun
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color="#6C63FF" />
              </TouchableOpacity>
            ) : (
              <>
                {[1, 2, 3, 4, 5].map(num => renderTask(num))}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  tabletContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  quoteContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabletQuoteContainer: {
    marginHorizontal: 0,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quoteTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 4,
  },
  quoteContent: {
    borderRadius: 15,
    padding: 20,
  },
  quoteText: {
    fontSize: 18,
    color: '#444',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'right',
    fontWeight: '500',
  },
  tasksContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabletTasksContainer: {
    marginHorizontal: 0,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  completedTask: {
    backgroundColor: '#F8F8F8',
  },
  taskIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  taskIcon: {
    fontSize: 24,
  },
  taskName: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  completedTaskText: {
    color: '#888',
    textDecorationLine: 'line-through',
  },
  taskProgress: {
    marginTop: 8,
  },
  taskProgressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  authBanner: {
    backgroundColor: '#6C63FF20',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  authBannerContent: {
    flex: 1,
  },
  authBannerTitle: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  authBannerText: {
    color: '#666',
    marginTop: 4,
  },
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 999,
  },
  celebrationAnimation: {
    width: 200,
    height: 200,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
  },
  celebrationText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 10,
    textAlign: 'center',
  },
}); 