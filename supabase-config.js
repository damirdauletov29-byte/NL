
// КОНФИГУРАЦИЯ SUPABASE ДЛЯ ТАБЛИЦЫ PLAYERS
// Скопируйте этот SQL код и выполните его в Supabase SQL Editor:
/*
CREATE TABLE players (
    id TEXT PRIMARY KEY, -- ID пользователя Telegram
    score INTEGER DEFAULT 0,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    referred_by TEXT, -- ID того, кто пригласил (реферальная система)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрой сортировки по очкам
CREATE INDEX idx_players_score ON players(score DESC);

-- Индекс для поиска по рефереру
CREATE INDEX idx_players_referred_by ON players(referred_by);

-- Настраиваем RLS (Row Level Security) для безопасности
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Разрешаем всем читать данные (для рейтинга)
CREATE POLICY "Все могут читать рейтинг" ON players
    FOR SELECT USING (true);

-- Разрешаем пользователям обновлять только свои записи
CREATE POLICY "Пользователи могут обновлять свои записи" ON players
    FOR UPDATE USING (true);

-- Разрешаем пользователям создавать свои записи
CREATE POLICY "Пользователи могут создавать свои записи" ON players
    FOR INSERT WITH CHECK (true);

-- Таблица для отслеживания рефералов
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_id TEXT NOT NULL, -- Кто пригласил
    referred_id TEXT NOT NULL, -- Кого пригласили
    reward_given BOOLEAN DEFAULT FALSE, -- Выдана ли награда
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (referrer_id) REFERENCES players(id),
    FOREIGN KEY (referred_id) REFERENCES players(id)
);

-- Индекс для быстрого поиска рефералов
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- RLS для таблицы referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Разрешаем читать свои рефералы
CREATE POLICY "Пользователи могут читать свои рефералы" ON referrals
    FOR SELECT USING (referrer_id = current_setting('app.current_user_id', TRUE));
*/
