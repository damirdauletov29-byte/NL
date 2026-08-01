
// КОНФИГУРАЦИЯ SUPABASE ДЛЯ ТАБЛИЦЫ PLAYERS
// Скопируйте этот SQL код и выполните его в Supabase SQL Editor:
/*
CREATE TABLE players (
    id TEXT PRIMARY KEY, -- ID пользователя Telegram
    score INTEGER DEFAULT 0,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для быстрой сортировки по очкам
CREATE INDEX idx_players_score ON players(score DESC);

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
*/
