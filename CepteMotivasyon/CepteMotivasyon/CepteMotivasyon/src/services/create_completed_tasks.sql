-- Önce mevcut politikaları ve tabloları temizle
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own completed tasks" ON public.completed_tasks;
DROP FUNCTION IF EXISTS update_task_completion;
DROP FUNCTION IF EXISTS get_or_create_daily_tasks;
DROP TABLE IF EXISTS public.completed_tasks;
DROP TABLE IF EXISTS public.tasks;

-- Önce tasks tablosunu oluştur
CREATE TABLE public.tasks (
    id SERIAL PRIMARY KEY,
    taskname VARCHAR(255) NOT NULL,
    taskicon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tasks tablosu için RLS politikaları
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Herkesin tasks tablosunu görebilmesi için politika
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
    FOR SELECT USING (true);

-- Completed Tasks tablosunu oluştur
CREATE TABLE public.completed_tasks (
    completed_task_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    task1_id INTEGER REFERENCES tasks(id),
    task2_id INTEGER REFERENCES tasks(id),
    task3_id INTEGER REFERENCES tasks(id),
    task4_id INTEGER REFERENCES tasks(id),
    task5_id INTEGER REFERENCES tasks(id),
    task1_completed BOOLEAN DEFAULT false,
    task2_completed BOOLEAN DEFAULT false,
    task3_completed BOOLEAN DEFAULT false,
    task4_completed BOOLEAN DEFAULT false,
    task5_completed BOOLEAN DEFAULT false,
    created_date DATE DEFAULT CURRENT_DATE,
    completed_count INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    max_streak INTEGER DEFAULT 0,
    last_completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_user_daily_tasks UNIQUE (user_id, created_date)
);

-- RLS politikalarını ayarla
ALTER TABLE public.completed_tasks ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların kendi kayıtlarını yönetebilmesi için politikalar
CREATE POLICY "Users can manage their own completed tasks"
ON public.completed_tasks
FOR ALL USING (auth.uid() = user_id);

-- Görev tamamlama durumunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_task_completion(
    p_completed_task_id UUID,
    p_task_number INTEGER,
    p_is_completed BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_column_name TEXT;
    v_completed_count INTEGER;
    v_last_completed_date DATE;
    v_current_streak INTEGER;
    v_max_streak INTEGER;
BEGIN
    -- Görev durumunu güncelle
    v_column_name := 'task' || p_task_number || '_completed';
    
    EXECUTE format('
        UPDATE public.completed_tasks
        SET %I = $1,
            last_completed_at = CASE WHEN $1 THEN NOW() ELSE last_completed_at END
        WHERE completed_task_id = $2
        AND user_id = auth.uid()
        RETURNING true', v_column_name)
    USING p_is_completed, p_completed_task_id;

    -- Tamamlanan görev sayısını güncelle
    UPDATE public.completed_tasks
    SET completed_count = (
        CASE WHEN task1_completed THEN 1 ELSE 0 END +
        CASE WHEN task2_completed THEN 1 ELSE 0 END +
        CASE WHEN task3_completed THEN 1 ELSE 0 END +
        CASE WHEN task4_completed THEN 1 ELSE 0 END +
        CASE WHEN task5_completed THEN 1 ELSE 0 END
    )
    WHERE completed_task_id = p_completed_task_id;

    -- Streak hesaplama
    SELECT 
        created_date,
        current_streak,
        max_streak
    INTO 
        v_last_completed_date,
        v_current_streak,
        v_max_streak
    FROM public.completed_tasks
    WHERE user_id = auth.uid()
    ORDER BY created_date DESC
    LIMIT 1;

    IF v_last_completed_date = CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := v_current_streak + 1;
        IF v_current_streak > v_max_streak THEN
            v_max_streak := v_current_streak;
        END IF;
    ELSIF v_last_completed_date < CURRENT_DATE - INTERVAL '1 day' THEN
        v_current_streak := 1;
    END IF;

    UPDATE public.completed_tasks
    SET 
        current_streak = v_current_streak,
        max_streak = v_max_streak
    WHERE completed_task_id = p_completed_task_id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Günlük görevleri oluşturma/güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION get_or_create_daily_tasks()
RETURNS TABLE (
    completed_task_id UUID,
    task1_id INTEGER,
    task2_id INTEGER,
    task3_id INTEGER,
    task4_id INTEGER,
    task5_id INTEGER,
    task1_completed BOOLEAN,
    task2_completed BOOLEAN,
    task3_completed BOOLEAN,
    task4_completed BOOLEAN,
    task5_completed BOOLEAN,
    created_date DATE,
    completed_count INTEGER,
    current_streak INTEGER,
    max_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_task_ids INTEGER[];
    v_completed_task_id UUID;
BEGIN
    -- Bugünün görevlerini kontrol et
    SELECT ct.completed_task_id INTO v_completed_task_id
    FROM completed_tasks ct
    WHERE ct.user_id = auth.uid()
    AND ct.created_date = CURRENT_DATE;

    -- Eğer bugün için görev yoksa yeni görevler oluştur
    IF v_completed_task_id IS NULL THEN
        -- Random 5 görev seç
        SELECT array_agg(id) INTO v_task_ids
        FROM (
            SELECT id FROM tasks
            ORDER BY random()
            LIMIT 5
        ) t;

        -- Yeni görevleri kaydet
        INSERT INTO completed_tasks (
            user_id,
            task1_id,
            task2_id,
            task3_id,
            task4_id,
            task5_id
        )
        VALUES (
            auth.uid(),
            v_task_ids[1],
            v_task_ids[2],
            v_task_ids[3],
            v_task_ids[4],
            v_task_ids[5]
        )
        RETURNING completed_task_id INTO v_completed_task_id;
    END IF;

    -- Görevleri döndür
    RETURN QUERY
    SELECT
        ct.completed_task_id,
        ct.task1_id,
        ct.task2_id,
        ct.task3_id,
        ct.task4_id,
        ct.task5_id,
        ct.task1_completed,
        ct.task2_completed,
        ct.task3_completed,
        ct.task4_completed,
        ct.task5_completed,
        ct.created_date,
        ct.completed_count,
        ct.current_streak,
        ct.max_streak
    FROM completed_tasks ct
    WHERE ct.completed_task_id = v_completed_task_id;
END;
$$;

-- Fonksiyonlara erişim izinleri
GRANT EXECUTE ON FUNCTION update_task_completion TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_daily_tasks TO authenticated;

-- Örnek görevleri ekle
INSERT INTO tasks (taskname, taskicon) VALUES
('10 dakika meditasyon yap', '🧘‍♂️'),
('1 litre su iç', '💧'),
('10 dakika egzersiz yap', '🏃‍♂️'),
('Sevdiğin birine mesaj at', '💌'),
('Günün güzel anını not al', '📝'),
('Yeni bir şey öğren', '📚'),
('Odanı düzenle', '🧹'),
('Bir arkadaşını ara', '📞'),
('5 dakika nefes egzersizi', '🌬️'),
('Kendine bir iltifat et', '🌟'),
('Bir şey için teşekkür et', '🙏'),
('10 dakika kitap oku', '📖'),
('Bir iyilik yap', '❤️'),
('3 dakika dans et', '💃'),
('Günlük plan yap', '📅'),
('Yeni bir şarkı keşfet', '🎵'),
('5 dakika germe hareketi', '🤸‍♂️'),
('Bir hobine zaman ayır', '🎨'),
('Güzel bir fotoğraf çek', '📸'),
('Sağlıklı bir atıştırmalık ye', '🥗'),
('Pencereden manzarayı izle', '🪟'),
('3 dakika sessizce otur', '🧘'),
('Sevdiğin bir şarkıyı dinle', '🎧'),
('Bir hedef belirle', '🎯'),
('Derin bir nefes al', '🍃'); 