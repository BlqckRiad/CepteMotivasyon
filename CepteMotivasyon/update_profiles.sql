-- Profiles tablosuna yeni sütunlar ekleme
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS completed_tasks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS achievement_points INTEGER DEFAULT 0;

-- RLS politikalarını güncelleme
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Okuma politikası
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Güncelleme politikası
CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Görev tamamlandığında puan ve sayı güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_achievements()
RETURNS TRIGGER AS $$
BEGIN
  -- Görev tamamlandığında
  IF NEW.task1_completed = true AND OLD.task1_completed = false OR
     NEW.task2_completed = true AND OLD.task2_completed = false OR
     NEW.task3_completed = true AND OLD.task3_completed = false OR
     NEW.task4_completed = true AND OLD.task4_completed = false OR
     NEW.task5_completed = true AND OLD.task5_completed = false THEN
    
    -- Profildeki tamamlanan görev sayısını ve puanı güncelle
    UPDATE profiles
    SET 
      completed_tasks = completed_tasks + 1,
      achievement_points = achievement_points + 2
    WHERE id = NEW.user_id;
  END IF;
  
  -- Görev geri alındığında
  IF NEW.task1_completed = false AND OLD.task1_completed = true OR
     NEW.task2_completed = false AND OLD.task2_completed = true OR
     NEW.task3_completed = false AND OLD.task3_completed = true OR
     NEW.task4_completed = false AND OLD.task4_completed = true OR
     NEW.task5_completed = false AND OLD.task5_completed = true THEN
    
    -- Profildeki tamamlanan görev sayısını ve puanı güncelle
    UPDATE profiles
    SET 
      completed_tasks = GREATEST(0, completed_tasks - 1),
      achievement_points = GREATEST(0, achievement_points - 2)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluşturma
DROP TRIGGER IF EXISTS on_task_completion ON user_tasks;
CREATE TRIGGER on_task_completion
  AFTER UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements(); 