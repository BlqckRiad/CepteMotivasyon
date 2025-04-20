import { supabase } from '../lib/supabase';
import badgeHelper from '../lib/badgeHelper';

class StreakService {
  async calculateStreak(userId) {
    console.log('calculateStreak çağrıldı');
    try {
      // Son 30 günü al (daha uzun bir geçmişe bakarak streak'i doğru hesaplayalım)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 29); // Son 30 gün

      // Kullanıcının görevlerini getir
      const { data: tasks, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('created_date', startDate.toISOString().split('T')[0])
        .lte('created_date', endDate.toISOString().split('T')[0])
        .order('created_date', { ascending: true });

      if (error) throw error;

      // Son 7 günü oluştur (görüntüleme için)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      // Tüm günleri map'le (streak hesaplama için)
      const allDays = {};
      tasks?.forEach(task => {
        const date = task.created_date.split('T')[0];
        allDays[date] = task.task1_completed && 
                       task.task2_completed && 
                       task.task3_completed && 
                       task.task4_completed && 
                       task.task5_completed;
      });
     
      // Streak hesaplama
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date(today);
      let isFirstDay = true;

      // Bugünden geriye doğru git
      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isCompleted = allDays[dateStr];

        // Eğer bugünse ve görevler tamamlanmamışsa, önceki güne bak
        if (isFirstDay && dateStr === today && !isCompleted) {
          isFirstDay = false;
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }

        // Eğer gün tamamlanmışsa streak'i artır
        if (isCompleted) {
          streak++;
          isFirstDay = false;
        } else {
          // Eğer gün tamamlanmamışsa ve bu ilk gün değilse, döngüyü bitir
          if (!isFirstDay) break;
        }

        // Bir önceki güne geç
        currentDate.setDate(currentDate.getDate() - 1);
        
        // 30 günden fazla geriye gitme
        if (currentDate < startDate) break;
      }

      // Son 7 günün görüntüleme verilerini hazırla
      const statusData = last7Days.map(date => {
        const dayTasks = tasks?.find(t => t.created_date.split('T')[0] === date);
        
        // Eğer o gün için hiç görev yoksa
        if (!dayTasks) {
          return {
            date,
            status: 0
          };
        }

        // Tüm görevlerin tamamlanma durumunu kontrol et
        const completedTasks = [
          dayTasks.task1_completed,
          dayTasks.task2_completed,
          dayTasks.task3_completed,
          dayTasks.task4_completed,
          dayTasks.task5_completed
        ].filter(Boolean).length;

        let status;
        if (completedTasks === 5) {
          status = 2; // Tüm görevler tamamlandı
        } else if (completedTasks > 0) {
          status = 1; // Bazı görevler tamamlandı
        } else {
          status = 0; // Hiç görev tamamlanmadı
        }

        return {
          date,
          status
        };
      });

      // Streak'i güncelle
      const { error: updateError } = await supabase
        .rpc('update_user_streak', { 
          user_id: userId, 
          new_streak: streak 
        });

      if (updateError) throw updateError;

      return {
        streak,
        statusData
      };

    } catch (error) {
      console.error('Error calculating streak:', error);
      throw error;
    }
  }

  async checkAndUpdateStreak(userId) {
    console.log('checkAndUpdateStreak çağrıldı');
    try {
      // Kullanıcının mevcut streak'ini al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_streak')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Bugünün tarihini al (UTC)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Son 2 günün görevlerini kontrol et
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentTasks, error: tasksError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .in('created_date', [
          today.toISOString().split('T')[0],
          yesterday.toISOString().split('T')[0]
        ]);

      if (tasksError) throw tasksError;

      // Bugün ve dünün görevlerini ayır
      const todayTasks = recentTasks?.find(task => 
        task.created_date === today.toISOString().split('T')[0]
      );
      const yesterdayTasks = recentTasks?.find(task => 
        task.created_date === yesterday.toISOString().split('T')[0]
      );

      // Bugün için görev tamamlanmış mı kontrol et
      const hasCompletedToday = todayTasks && 
        todayTasks.task1_completed && 
        todayTasks.task2_completed && 
        todayTasks.task3_completed && 
        todayTasks.task4_completed && 
        todayTasks.task5_completed;

      // Dün için görev tamamlanmış mı kontrol et
      const hasCompletedYesterday = yesterdayTasks && 
        yesterdayTasks.task1_completed && 
        yesterdayTasks.task2_completed && 
        yesterdayTasks.task3_completed && 
        yesterdayTasks.task4_completed && 
        yesterdayTasks.task5_completed;

      let newStreak = profile.user_streak || 0;
      let shouldUpdateStreak = false;

      if (hasCompletedToday) {
        // Eğer dün de tamamlanmışsa veya hiç streak yoksa streak'i artır
        if (hasCompletedYesterday || newStreak === 0) {
          newStreak += 1;
          shouldUpdateStreak = true;
        }
      } else if (hasCompletedYesterday) {
        // Eğer bugün tamamlanmamış ve dün tamamlanmışsa streak'i sıfırla
        newStreak = 0;
        shouldUpdateStreak = true;
      }

      if (shouldUpdateStreak) {
        // Streak'i güncelle
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_streak: newStreak
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        // Streak rozetlerini güncelle
        if (badgeHelper && typeof badgeHelper.updateStreakBadge === 'function') {
          await badgeHelper.updateStreakBadge(userId, newStreak);
        }
      }

      return newStreak;
    } catch (error) {
      console.error('Error in checkAndUpdateStreak:', error);
      throw error;
    }
  }
}

const streakService = new StreakService();
export default streakService; 