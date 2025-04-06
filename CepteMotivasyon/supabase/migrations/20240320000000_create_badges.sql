-- Rozet tipleri tablosu
CREATE TABLE IF NOT EXISTS badge_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Rozetler tablosu
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    badge_type_id INTEGER REFERENCES badge_types(id) NOT NULL,
    level INTEGER NOT NULL,
    requirement INTEGER NOT NULL,
    points INTEGER NOT NULL,
    icon TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Kullanıcı rozetleri tablosu
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    badge_id INTEGER REFERENCES badges(id) NOT NULL,
    progress INTEGER DEFAULT 0 NOT NULL,
    is_achieved BOOLEAN DEFAULT false NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- Rozet tiplerini ekle
INSERT INTO badge_types (name, description, icon) VALUES
    ('Streak Master', 'Günlük görev serisi başarısı', 'mdi-fire'),
    ('Task Champion', 'Görev tamamlama başarısı', 'mdi-trophy'),
    ('Daily Warrior', 'Uygulamaya giriş başarısı', 'mdi-calendar-check');

-- Rozetleri ekle
INSERT INTO badges (badge_type_id, level, requirement, points, icon) VALUES
    -- Streak rozetleri
    (1, 1, 3, 100, 'mdi-fire'),
    (1, 2, 7, 250, 'mdi-fire'),
    (1, 3, 14, 500, 'mdi-fire'),
    (1, 4, 30, 1000, 'mdi-fire'),
    (1, 5, 60, 2000, 'mdi-fire'),
    
    -- Görev tamamlama rozetleri
    (2, 1, 10, 100, 'mdi-trophy'),
    (2, 2, 25, 250, 'mdi-trophy'),
    (2, 3, 50, 500, 'mdi-trophy'),
    (2, 4, 100, 1000, 'mdi-trophy'),
    (2, 5, 200, 2000, 'mdi-trophy'),
    
    -- Günlük giriş rozetleri
    (3, 1, 5, 100, 'mdi-calendar-check'),
    (3, 2, 15, 250, 'mdi-calendar-check'),
    (3, 3, 30, 500, 'mdi-calendar-check'),
    (3, 4, 60, 1000, 'mdi-calendar-check'),
    (3, 5, 100, 2000, 'mdi-calendar-check');

-- RLS politikaları
ALTER TABLE badge_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Herkes badge_types ve badges tablolarını okuyabilir
CREATE POLICY "Public badge_types are viewable by everyone" ON badge_types
    FOR SELECT USING (true);

CREATE POLICY "Public badges are viewable by everyone" ON badges
    FOR SELECT USING (true);

-- Kullanıcılar sadece kendi rozetlerini görebilir ve güncelleyebilir
CREATE POLICY "Users can view their own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own badges" ON user_badges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id); 