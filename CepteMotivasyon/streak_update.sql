-- Profiles tablosuna streak kolonu ekleme
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_streak INTEGER DEFAULT 0;

-- Streak güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID, new_streak INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET user_streak = new_streak
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Streak güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_task_date DATE;
    completed_count INTEGER;
    current_streak INTEGER;
BEGIN
    -- Bugün en az bir görev tamamlanmış mı kontrol et
    SELECT COUNT(*) INTO completed_count
    FROM user_tasks
    WHERE user_id = NEW.user_id 
    AND created_date = CURRENT_DATE
    AND (task1_completed = true OR task2_completed = true OR 
         task3_completed = true OR task4_completed = true OR 
         task5_completed = true);

    -- Kullanıcının mevcut streak'ini al
    SELECT user_streak INTO current_streak
    FROM profiles
    WHERE id = NEW.user_id;

    -- Son görev tarihini al
    SELECT MAX(created_date) INTO last_task_date
    FROM user_tasks
    WHERE user_id = NEW.user_id
    AND created_date < CURRENT_DATE;

    -- Streak mantığı
    IF completed_count > 0 THEN
        -- Eğer son görev dünse veya ilk görevse streak'i artır
        IF last_task_date = CURRENT_DATE - INTERVAL '1 day' OR last_task_date IS NULL THEN
            UPDATE profiles
            SET 
                user_streak = user_streak + 1
            WHERE id = NEW.user_id;
        END IF;
    ELSE
        -- Eğer bugün hiç görev tamamlanmamışsa ve son görev dün değilse streak'i sıfırla
        IF last_task_date < CURRENT_DATE - INTERVAL '1 day' THEN
            UPDATE profiles
            SET user_streak = 0
            WHERE id = NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluşturma
DROP TRIGGER IF EXISTS on_task_update_streak ON user_tasks;
CREATE TRIGGER on_task_update_streak
    AFTER UPDATE ON user_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Günlük görev durumu görüntüleme fonksiyonu
CREATE OR REPLACE FUNCTION get_user_task_status(user_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    task_date DATE,
    completion_status INTEGER -- 0: Hiç yapılmamış, 1: Kısmen yapılmış, 2: Tamamlanmış
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dates.date::DATE as task_date,
        CASE 
            WHEN ut.id IS NULL THEN 0
            WHEN (ut.task1_completed AND ut.task2_completed AND ut.task3_completed AND ut.task4_completed AND ut.task5_completed) THEN 2
            WHEN (ut.task1_completed OR ut.task2_completed OR ut.task3_completed OR ut.task4_completed OR ut.task5_completed) THEN 1
            ELSE 0
        END as completion_status
    FROM generate_series(start_date, end_date, '1 day'::interval) AS dates(date)
    LEFT JOIN user_tasks ut ON DATE(ut.created_date) = dates.date AND ut.user_id = get_user_task_status.user_id
    ORDER BY dates.date;
END;
$$ LANGUAGE plpgsql; 