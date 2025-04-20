import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl, Dimensions, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

const HomeScreen = () => {
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [orientation, setOrientation] = useState(
    Dimensions.get('window').width > Dimensions.get('window').height ? 'landscape' : 'portrait'
  );
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [dailyQuote, setDailyQuote] = useState(null);
  const [todayTasks, setTodayTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const [sound, setSound] = useState();
  const [allQuotes, setAllQuotes] = useState([]);

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    const subscription = Dimensions.addEventListener('change', updateOrientation);

    return () => {
      subscription?.remove();
    };
  }, []);
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    
    // Second, call scheduleNotificationAsync()
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Günaydın! 🌞',
        body: 'Bugün görevlerini tamamlamayı unutma!',
      },
      trigger: {
        seconds: 2, // 5 saniye sonra tetiklenecek
        repeats: true, // sürekli tekrarlanacak
      },
    });
    
  }, []);

  const fetchQuote = async () => {
    try {
      // Eğer allQuotes boşsa, tüm alıntıları çek
      if (allQuotes.length === 0) {
    const { data, error } = await supabase
          .from('quotes')
          .select('*');

        if (error) throw error;
        
        if (data && data.length > 0) {
          setAllQuotes(data);
          // Rastgele bir alıntı seç
          const randomIndex = Math.floor(Math.random() * data.length);
          setQuote(data[randomIndex]);
        }
      } else {
        // allQuotes zaten doluysa, onun içinden rastgele seç
        let randomIndex;
        let newQuote;
        
        // Mevcut alıntıdan farklı bir tane seçilene kadar devam et
        do {
          randomIndex = Math.floor(Math.random() * allQuotes.length);
          newQuote = allQuotes[randomIndex];
        } while (newQuote.text === quote.text && allQuotes.length > 1);
        
        setQuote(newQuote);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Hata durumunda varsayılan bir alıntı göster
      setQuote({
        text: "Hayat, onu değiştirme cesaretine sahip olanlarındır.",
        author: "Mehmet Akif Ersoy"
      });
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .limit(5)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const shuffledData = data ? data.sort(() => Math.random() - 0.5) : [];

      if (shuffledData.length > 0) {
        const tasksWithIcons = shuffledData.map(task => ({
          ...task,
          icon: task.icon || '📝'
        }));
        setTasks(tasksWithIcons);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const checkTodayTasks = async () => {
    if (!user) return null;
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    try {
      // Bugün için görev var mı kontrol et
      const { data: existingTasks, error: existingError } = await supabase
        .from('user_tasks')
        .select(`
          *,
          task1:tasks!task1_id(*),
          task2:tasks!task2_id(*),
          task3:tasks!task3_id(*),
          task4:tasks!task4_id(*),
          task5:tasks!task5_id(*)
        `)
        .eq('user_id', user.id)
        .eq('created_date', todayStr)
        .single();

      // Bugün için görev varsa, onu döndür
      if (existingTasks && !existingError) {
        return existingTasks;
      }

      // Tüm görevleri çek
      const { data: allTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Rastgele 5 görev seç
      const shuffledTasks = allTasks.sort(() => Math.random() - 0.5).slice(0, 5);

      // Yeni görev kaydı oluştur
      const { data: newTasks, error: insertError } = await supabase
        .from('user_tasks')
        .insert({
          user_id: user.id,
          task1_id: shuffledTasks[0].id,
          task2_id: shuffledTasks[1].id,
          task3_id: shuffledTasks[2].id,
          task4_id: shuffledTasks[3].id,
          task5_id: shuffledTasks[4].id,
          created_date: todayStr,
          task1_completed: false,
          task2_completed: false,
          task3_completed: false,
          task4_completed: false,
          task5_completed: false
        })
        .select(`
          *,
          task1:tasks!task1_id(*),
          task2:tasks!task2_id(*),
          task3:tasks!task3_id(*),
          task4:tasks!task4_id(*),
          task5:tasks!task5_id(*)
        `)
        .single();

      if (insertError) throw insertError;
      return newTasks;

    } catch (error) {
      console.error('Error in checkTodayTasks:', error);
      return null;
    }
  };

  const getRandomTasks = async () => {
    try {
      // Önce tüm görevleri çek
      const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) throw error;

      // Görevleri karıştır
      const shuffledTasks = allTasks.sort(() => Math.random() - 0.5);
      
      // İlk 5 görevi al
      return shuffledTasks.slice(0, 5);
    } catch (error) {
      console.error('Error getting random tasks:', error);
      return null;
    }
  };

  const createTodayTasks = async () => {
    const randomTasks = await getRandomTasks();
    
    if (!randomTasks || !user) return null;

    // Bugünün tarihini YYYY-MM-DD formatında al
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_tasks')
      .insert({
        user_id: user.id,
        task1_id: randomTasks[0].id,
        task2_id: randomTasks[1].id,
        task3_id: randomTasks[2].id,
        task4_id: randomTasks[3].id,
        task5_id: randomTasks[4].id,
        created_date: todayStr, // Bugünün tarihini ekle
        task1_completed: false,
        task2_completed: false,
        task3_completed: false,
        task4_completed: false,
        task5_completed: false
      })
      .select(`
        *,
        task1:tasks!task1_id(*),
        task2:tasks!task2_id(*),
        task3:tasks!task3_id(*),
        task4:tasks!task4_id(*),
        task5:tasks!task5_id(*)
      `)
      .single();

    if (error) {
      console.error('Error creating today tasks:', error);
      return null;
    }

    return data;
  };

  const playCelebrationSound = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/sounds/success.mp3')
    );
    setSound(sound);
    await sound.playAsync();
  };

  const checkAllTasksCompleted = () => {
    if (!todayTasks) return false;
    return [1, 2, 3, 4, 5].every(num => todayTasks[`task${num}_completed`]);
  };

  const toggleTaskCompletion = async (taskNumber) => {
    if (!todayTasks) return;

    try {
      const taskCompletedField = `task${taskNumber}_completed`;
      const currentStatus = todayTasks[taskCompletedField];

      const { data, error } = await supabase
        .from('user_tasks')
        .update({ [taskCompletedField]: !currentStatus })
        .eq('id', todayTasks.id)
        .select(`
          *,
          task1:tasks!task1_id(*),
          task2:tasks!task2_id(*),
          task3:tasks!task3_id(*),
          task4:tasks!task4_id(*),
          task5:tasks!task5_id(*)
        `)
        .single();

      if (error) throw error;

      setTodayTasks(data);

      // Tüm görevler tamamlandı mı kontrol et
      const allCompleted = [1, 2, 3, 4, 5].every(num => 
        num === taskNumber ? !currentStatus : data[`task${num}_completed`]
      );

      if (allCompleted) {
        setShowConfetti(true);
        if (confettiRef.current) {
          confettiRef.current.start();
        }
        await playCelebrationSound();
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error updating task completion:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchQuote();
      const todayTasksData = await checkTodayTasks();
      setTodayTasks(todayTasksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Her bir dakikada bir gün değişimini kontrol et
  useEffect(() => {
    const checkDayChange = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        loadData(); // Gün değiştiğinde verileri yenile
      }
    };

    const interval = setInterval(checkDayChange, 60000); // Her dakika kontrol et

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderTask = (taskNumber) => {
    if (!todayTasks) return null;
    
    const task = todayTasks[`task${taskNumber}`];
    const completed = todayTasks[`task${taskNumber}_completed`];
    
    if (!task) return null;

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          { backgroundColor: colors.card, borderColor: colors.border },
          completed && { backgroundColor: colors.success, borderColor: colors.successBorder }
        ]}
        onPress={() => toggleTaskCompletion(taskNumber)}
      >
        <MaterialCommunityIcons
          name={completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
          size={24}
          color={completed ? colors.primary : colors.subtext}
        />
        <Text style={[
          styles.taskText,
          { color: colors.text },
          completed && { color: colors.primary }
        ]}>
          {task.title}
        </Text>
        {task.icon && (
          <Text style={styles.taskIcon}>{task.icon}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuoteCard = () => (
    <View style={[
      styles.quoteCard, 
      orientation === 'landscape' && styles.quoteCardLandscape,
      { marginHorizontal: 16 }
    ]}>
      <View style={styles.quoteIconContainer}>
        <Text style={styles.quoteIcon}>💭</Text>
      </View>
      <Text style={[styles.quoteText, orientation === 'landscape' && { fontSize: 20, lineHeight: 28 }]}>
        {quote.text || "Hayat, onu değiştirme cesaretine sahip olanlarındır."}
      </Text>
      <Text style={[styles.quoteAuthor, orientation === 'landscape' && { fontSize: 16 }]}>
        - {quote.author || "Mehmet Akif Ersoy"}
      </Text>
    </View>
  );

  const renderLoginMessage = () => (
    <View style={[styles.tasksCard, orientation === 'landscape' && styles.tasksCardLandscape]}>
      <View style={styles.loginMessageContainer}>
        <MaterialCommunityIcons name="account-lock" size={orientation === 'landscape' ? 60 : 48} color="#666" />
        <Text style={styles.loginMessageTitle}>Görevlerinizi görmek için giriş yapın</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginButtonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTasksHeader = () => {
    const completedCount = tasks.filter(task => task.completed).length;
    const totalCount = tasks.length;

    return (
      <View style={styles.tasksHeader}>
        <Text style={styles.tasksHeaderTitle}>Bugünün Görevleri</Text>
        <Text style={styles.tasksHeaderCount}>
          Tamamlanan {completedCount}/{totalCount}
        </Text>
      </View>
    );
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.taskItem, 
        item.completed && styles.taskCompleted
      ]}
      onPress={() => toggleTaskCompletion(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.taskContent}>
        <View style={styles.taskIconContainer}>
          <Text style={styles.taskEmoji}>{item.icon}</Text>
        </View>
        <View style={styles.taskTextContainer}>
          <Text style={[
            styles.taskText, 
            item.completed && styles.taskTextCompleted,
            orientation === 'landscape' && styles.taskTextTablet
          ]}>
            {item.title}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={item.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
          size={24}
          color={item.completed ? "#4CAF50" : "#666"}
          style={styles.taskCheckIcon}
        />
      </View>
    </TouchableOpacity>
  );

  const renderTasksCard = () => (
    <View style={[styles.tasksCard, orientation === 'landscape' && styles.tasksCardLandscape]}>
      {renderTasksHeader()}
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskItemWrapper}>
          {renderTaskItem({ item: task })}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={[
          styles.contentContainer,
          orientation === 'landscape' && {
            flexDirection: 'row',
            paddingHorizontal: '5%',
          }
        ]}>
          <View style={[
            styles.quoteSection,
            orientation === 'landscape' && {
              flex: 1,
              marginRight: 10,
            }
          ]}>
            <View style={[
              styles.quoteCard,
              { backgroundColor: colors.card },
            ]}>
              <View style={styles.quoteIconContainer}>
                <Text style={styles.quoteIcon}>💭</Text>
              </View>
              <Text style={[
                styles.quoteText,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 20, lineHeight: 28 }
              ]}>
                {quote.text || "Hayat, onu değiştirme cesaretine sahip olanlarındır."}
              </Text>
              <Text style={[
                styles.quoteAuthor,
                { color: colors.subtext },
                orientation === 'landscape' && { fontSize: 16 }
              ]}>
                - {quote.author || "Mehmet Akif Ersoy"}
              </Text>
            </View>
          </View>

          <View style={[
            styles.tasksSection,
            orientation === 'landscape' && {
              flex: 1,
              marginLeft: 10,
            }
          ]}>
            <View style={[
              styles.tasksContainer,
              { backgroundColor: colors.card }
            ]}>
              <Text style={[
                styles.tasksTitle,
                { color: colors.text },
                orientation === 'landscape' && { fontSize: 22 }
              ]}>
                Günlük Görevleriniz
              </Text>
              <Text style={[
                styles.tasksSubtitle,
                { color: colors.subtext },
                orientation === 'landscape' && { fontSize: 16 }
              ]}>
                Bugün için size özel seçilmiş 5 görev
              </Text>
              
              <View style={styles.tasksList}>
                {[1, 2, 3, 4, 5].map((taskNumber) => (
                  <View key={`task-${taskNumber}`}>
                    {renderTask(taskNumber)}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {showConfetti && (
        <>
          <ConfettiCannon
            ref={confettiRef}
            count={200}
            origin={{ x: Dimensions.get('window').width / 2, y: Dimensions.get('window').height }}
            autoStart={false}
            fadeOut={true}
          />
          <View style={styles.celebrationOverlay}>
            <Text style={styles.celebrationText}>Tebrikler! 🎉</Text>
            <Text style={styles.celebrationSubText}>Bugünün tüm görevlerini tamamladınız!</Text>
    </View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  quoteSection: {
    marginBottom: 20,
  },
  tasksSection: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quoteIconContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  quoteIcon: {
    fontSize: 32,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  quoteAuthor: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'right',
  },
  tasksContainer: {
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  tasksSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  taskIcon: {
    fontSize: 20,
    marginLeft: 8,
  },
  quoteCardLandscape: {
    marginHorizontal: '5%',
  },
  tasksCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tasksCardLandscape: {
    marginHorizontal: '5%',
  },
  loginMessageContainer: {
    alignItems: 'center',
    padding: 30,
  },
  loginMessageTitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tasksHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tasksHeaderCount: {
    fontSize: 16,
    color: '#666',
  },
  taskItemWrapper: {
    marginBottom: 12,
  },
  taskCompleted: {
    backgroundColor: '#E8F5E9',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskEmoji: {
    fontSize: 18,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTextTablet: {
    fontSize: 18,
  },
  celebrationOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    margin: 20,
    borderRadius: 15,
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  celebrationSubText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default HomeScreen; 