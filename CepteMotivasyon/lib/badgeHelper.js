import { supabase } from './supabase';

export const updateBadgeProgress = async (userId, badgeTypeId, progress) => {
  try {
    // İlgili badge_type'a ait tüm rozetleri al
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      .eq('badge_type_id', badgeTypeId)
      .order('level', { ascending: true });

    if (badgesError) throw badgesError;

    // Kullanıcının mevcut rozetlerini al
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .in('badge_id', badges.map(b => b.id));

    if (userBadgesError) throw userBadgesError;

    // Her rozet için ilerlemeyi kontrol et
    for (const badge of badges) {
      const userBadge = userBadges?.find(ub => ub.badge_id === badge.id);
      
      if (!userBadge) {
        // Yeni rozet oluştur
        const { error: insertError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: badge.id,
            progress: progress,
            is_achieved: progress >= badge.requirement,
            achieved_at: progress >= badge.requirement ? new Date().toISOString() : null
          });

        if (insertError) throw insertError;
      } else if (!userBadge.is_achieved) {
        // Mevcut rozeti güncelle
        const isAchieved = progress >= badge.requirement;
        const { error: updateError } = await supabase
          .from('user_badges')
          .update({
            progress: progress,
            is_achieved: isAchieved,
            achieved_at: isAchieved ? new Date().toISOString() : null
          })
          .eq('id', userBadge.id);

        if (updateError) throw updateError;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating badge progress:', error);
    return false;
  }
};

// Streak rozetini güncelle
export const updateStreakBadge = async (userId, streakCount) => {
  return updateBadgeProgress(userId, 1, streakCount);
};

// Görev tamamlama rozetini güncelle
export const updateTaskBadge = async (userId, completedTasks) => {
  return updateBadgeProgress(userId, 2, completedTasks);
};

// Günlük giriş rozetini güncelle
export const updateDailyLoginBadge = async (userId, loginDays) => {
  return updateBadgeProgress(userId, 3, loginDays);
}; 