-- Clear existing data
TRUNCATE quotes CASCADE;
TRUNCATE tasks CASCADE;

-- Insert 25 motivational quotes
INSERT INTO quotes (text, author) VALUES
('Başarı, her gün tekrarlanan küçük çabaların toplamıdır.', 'Robert Collier'),
('Hayatta en büyük zafer, hiçbir zaman düşmemek değil, her düştüğünde ayağa kalkmaktır.', 'Konfüçyus'),
('Bugün yapabileceğini yarına bırakma.', 'Benjamin Franklin'),
('Her yeni gün, yeni bir başlangıçtır.', 'Buddha'),
('Zorluklar, fırsatların kılık değiştirmiş halidir.', 'Albert Einstein'),
('Başarı bir yolculuktur, bir varış noktası değil.', 'Arthur Ashe'),
('Düşlediğin hayatı yaşamak için, konfor alanından çıkmalısın.', 'Neale Donald Walsch'),
('Değişim kaçınılmazdır, gelişim bir seçimdir.', 'John C. Maxwell'),
('Hayallerinizin büyüklüğü, başarınızın sınırlarını belirler.', 'Zig Ziglar'),
('En büyük zafer, insanın kendini fethetmesidir.', 'Platon'),
('Her başarısızlık, başarıya giden yolda bir adımdır.', 'Thomas Edison'),
('Mutluluğun anahtarı, sahip olduklarına değil, yapabildiklerine odaklanmaktır.', 'Mevlana'),
('Kendine inan, gerisi kendiliğinden gelir.', 'Mustafa Kemal Atatürk'),
('Başarı, hazırlık ile fırsat buluştuğunda ortaya çıkar.', 'Bobby Unser'),
('Hayat, ya cesur bir macera olacak ya da hiçbir şey.', 'Helen Keller'),
('Zirveye çıkmak için önce tırmanmayı göze almalısın.', 'Vince Lombardi'),
('Başarının sırrı, başlamaktır.', 'Mark Twain'),
('Her gün bir önceki günden daha iyi olmaya çalış.', 'Jimmy Johnson'),
('Yapabileceğini düşün, düşündüğünü yapabilirsin.', 'Dale Carnegie'),
('Zorluklar bizi güçlendirir.', 'Ralph Waldo Emerson'),
('Başarı, düştükten sonra bir kez daha ayağa kalkmaktır.', 'Winston Churchill'),
('Hayallerinizin peşinden koşmak için asla geç değildir.', 'Walt Disney'),
('İnanç, görmeden önceki görüştür.', 'Martin Luther King Jr.'),
('Büyük başarılar, küçük başlangıçlardan doğar.', 'Lao Tzu'),
('Yarının bugünden daha iyi olacağına inan.', 'Benjamin Franklin');

-- Insert 25 tasks with emojis
INSERT INTO tasks (title, icon, completed, created_at) VALUES
('Sabah Yürüyüşü', '🚶', false, NOW()),
('Meditasyon', '🧘', false, NOW()),
('Su İçmeyi Unutma', '💧', false, NOW()),
('Günlük Okuma', '📚', false, NOW()),
('Günlük Plan', '📝', false, NOW()),
('Yoga Pratiği', '🧘‍♀️', false, NOW()),
('Sağlıklı Kahvaltı', '🥗', false, NOW()),
('Vitamin Takviyesi', '💊', false, NOW()),
('Dil Çalışması', '🗣️', false, NOW()),
('Spor Egzersizi', '🏋️', false, NOW()),
('Kod Yazma', '💻', false, NOW()),
('Blog Yazısı', '✍️', false, NOW()),
('Networking', '🤝', false, NOW()),
('Podcast Dinle', '🎧', false, NOW()),
('Proje Planlaması', '📊', false, NOW()),
('Mindfulness', '🧠', false, NOW()),
('Günlük Yazma', '📔', false, NOW()),
('Esneme Hareketleri', '🤸', false, NOW()),
('Müzik Çalışması', '🎵', false, NOW()),
('Ev Düzenleme', '🏠', false, NOW()),
('Bütçe Planlaması', '💰', false, NOW()),
('Yeni Beceri', '🎯', false, NOW()),
('Dijital Detoks', '📱', false, NOW()),
('Aile Zamanı', '👨‍👩‍👧‍👦', false, NOW()),
('Haftalık Değerlendirme', '��', false, NOW()); 