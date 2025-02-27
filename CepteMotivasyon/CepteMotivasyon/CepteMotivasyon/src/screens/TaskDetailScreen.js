import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Animated,
  AppState,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function TaskDetailScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [taskHistory, setTaskHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [firstTaskDate, setFirstTaskDate] = useState(null);
  const [streakInfo, setStreakInfo] = useState({
    currentStreak: 0,
    maxStreak: 0,
    totalTasksCompleted: 0
  });
  const { user } = useAuth();
  const isTablet = width > 768;

  const fetchTaskHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('completed_tasks')
        .select(`
          completed_task_id,
          created_date,
          completed_count,
          current_streak,
          max_streak,
          task1_completed,
          task2_completed,
          task3_completed,
          task4_completed,
          task5_completed,
          tasks1:tasks!task1_id(taskname, taskicon),
          tasks2:tasks!task2_id(taskname, taskicon),
          tasks3:tasks!task3_id(taskname, taskicon),
          tasks4:tasks!task4_id(taskname, taskicon),
          tasks5:tasks!task5_id(taskname, taskicon)
        `)
        .eq('user_id', user.id)
        .order('created_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setFirstTaskDate(data[0].created_date);
        setTaskHistory(data);
        
        const latestData = data[data.length - 1];
        setStreakInfo({
          currentStreak: latestData.current_streak,
          maxStreak: latestData.max_streak,
          totalTasksCompleted: data.reduce((sum, day) => sum + day.completed_count, 0)
        });
      } else {
        // Eğer veri yoksa state'leri sıfırla
        setFirstTaskDate(null);
        setTaskHistory([]);
        setStreakInfo({
          currentStreak: 0,
          maxStreak: 0,
          totalTasksCompleted: 0
        });
      }
    } catch (error) {
      console.error('Error fetching task history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Ekran fokuslandığında veriyi güncelle
  useFocusEffect(
    useCallback(() => {
      fetchTaskHistory();
    }, [fetchTaskHistory])
  );

  // AppState değişikliklerini dinle
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        fetchTaskHistory();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [fetchTaskHistory]);

  // Realtime subscription ile verileri dinle
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('completed_tasks_changes')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'completed_tasks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchTaskHistory();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchTaskHistory]);

  const getWeekDays = () => {
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i + (weekOffset * 7));
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('tr-TR', { weekday: 'short' }),
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('tr-TR', { month: 'short' }),
        isToday: i === 0 && weekOffset === 0
      });
    }
    return days;
  };

  const canGoBack = () => {
    if (!firstTaskDate) return false;
    const firstDate = new Date(firstTaskDate);
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7) - 6);
    return currentWeekStart > firstDate;
  };

  const getDayStatus = (date) => {
    const dayTasks = taskHistory.find(task => task.created_date === date);
    if (!dayTasks) return 'empty';
    
    const completedCount = dayTasks.completed_count;
    if (completedCount === 5) return 'complete';
    if (completedCount > 0) return 'partial';
    return 'empty';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#4CAF50';
      case 'partial': return '#FFC107';
      case 'empty': return '#FF4444';
      default: return '#E0E0E0';
    }
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <View style={styles.weekContainer}>
        <TouchableOpacity 
          style={styles.weekArrow}
          onPress={() => setWeekOffset(prev => prev - 1)}
          disabled={!canGoBack()}
        >
          <Ionicons 
            name="chevron-back" 
            size={24} 
            color={canGoBack() ? '#6C63FF' : '#CCC'} 
          />
        </TouchableOpacity>

        <View style={styles.daysContainer}>
          {weekDays.map((day, index) => {
            const status = getDayStatus(day.date);
            const isBeforeFirstTask = firstTaskDate && day.date < firstTaskDate;
            
            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayItem,
                  day.isToday && styles.todayItem,
                  day.date === selectedDate && styles.selectedDayItem,
                ]}
                onPress={() => !isBeforeFirstTask && setSelectedDate(day.date)}
                disabled={isBeforeFirstTask}
              >
                <Text style={[
                  styles.dayName,
                  day.isToday && styles.todayText,
                  isBeforeFirstTask && styles.disabledText
                ]}>
                  {day.dayName}
                </Text>
                <View style={[
                  styles.dayNumber,
                  { backgroundColor: isBeforeFirstTask ? '#E0E0E0' : getStatusColor(status) }
                ]}>
                  <Text style={styles.dayNumberText}>
                    {day.dayNumber}
                  </Text>
                </View>
                <Text style={[
                  styles.monthName,
                  day.isToday && styles.todayText,
                  isBeforeFirstTask && styles.disabledText
                ]}>
                  {day.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.weekArrow}
          onPress={() => setWeekOffset(prev => prev + 1)}
          disabled={weekOffset === 0}
        >
          <Ionicons 
            name="chevron-forward" 
            size={24} 
            color={weekOffset === 0 ? '#CCC' : '#6C63FF'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSelectedDayTasks = () => {
    const dayTasks = taskHistory.find(day => day.created_date === selectedDate);
    if (!dayTasks) return null;

    return (
      <View style={styles.selectedDayTasks}>
        <Text style={styles.selectedDayTitle}>
          {new Date(selectedDate).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </Text>
        {[1, 2, 3, 4, 5].map(num => (
          <View key={num} style={styles.taskItem}>
            <View style={styles.taskIconContainer}>
              <LinearGradient
                colors={[dayTasks[`task${num}_completed`] ? '#4CAF5020' : '#6C63FF20', '#FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.taskIconGradient}
              >
                <Text style={styles.taskIcon}>{dayTasks[`tasks${num}`].taskicon}</Text>
              </LinearGradient>
              {dayTasks[`task${num}_completed`] && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </View>
            <Text style={[
              styles.taskName,
              dayTasks[`task${num}_completed`] && styles.completedTaskText
            ]}>
              {dayTasks[`tasks${num}`].taskname}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, isTablet && styles.tabletContent]}>
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#6C63FF20', '#4CAF5020']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsCard}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakInfo.currentStreak}</Text>
              <Text style={styles.statLabel}>Günlük Seri</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakInfo.maxStreak}</Text>
              <Text style={styles.statLabel}>En Uzun Seri</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{streakInfo.totalTasksCompleted}</Text>
              <Text style={styles.statLabel}>Toplam Görev</Text>
            </View>
          </LinearGradient>
        </View>

        {renderWeekView()}
        {renderSelectedDayTasks()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#FFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  weekContainer: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  weekArrow: {
    width: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 2,
  },
  dayItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: 2,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 1,
    maxWidth: '13%',
  },
  todayItem: {
    backgroundColor: '#6C63FF10',
  },
  selectedDayItem: {
    backgroundColor: '#6C63FF20',
  },
  dayName: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  monthName: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  todayText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  disabledText: {
    color: '#CCC',
  },
  dayNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  dayNumberText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  selectedDayTasks: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  taskIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIcon: {
    fontSize: 24,
  },
  checkmarkContainer: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: '#FFF',
    borderRadius: 12,
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
}); 