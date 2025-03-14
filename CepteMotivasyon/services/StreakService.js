import { supabase } from '../lib/supabase';

class StreakService {
  static async calculateStreak(userId) {
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
}

export default StreakService; 