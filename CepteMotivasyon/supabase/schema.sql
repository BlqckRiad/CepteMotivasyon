-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create username validation function
CREATE OR REPLACE FUNCTION public.check_username_exists(username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.username = check_username_exists.username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create a trigger to set updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Secure the tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks
  FOR SELECT USING (true);

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, LOWER((NEW.raw_user_meta_data->>'username')::text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, now()) NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  icon VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('UTC'::text, now()) NOT NULL
);

-- Create function for random quote
CREATE OR REPLACE FUNCTION get_random_quote()
RETURNS TABLE (text TEXT, author VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT quotes.text, quotes.author
  FROM quotes
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial quotes
INSERT INTO quotes (text, author) VALUES
('Başarı, her gün tekrarlanan küçük çabaların toplamıdır.', 'Robert Collier'),
('Hayatta en büyük zafer, hiçbir zaman düşmemek değil, her düştüğünde ayağa kalkmaktır.', 'Konfüçyus'),
('Bugün yapabileceğini yarına bırakma.', 'Benjamin Franklin'),
('Hedefleriniz konforlu alanınızın dışında olmalı.', 'John C. Maxwell'),
('Başarı bir yolculuktur, bir varış noktası değil.', 'Arthur Ashe'),
('Her başarısızlık, başarıya giden yolda bir adımdır.', 'Thomas Edison'),
('Hayallerinizin büyüklüğü, başarınızın sınırlarını belirler.', 'Zig Ziglar'),
('Değişim kaçınılmazdır, gelişim bir seçimdir.', 'John C. Maxwell'),
('Başarı, hazırlık ile fırsat buluştuğunda ortaya çıkar.', 'Bobby Unser'),
('En büyük zafer, insanın kendini fethetmesidir.', 'Platon'); 