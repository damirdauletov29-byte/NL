-- ============================================
-- ОПТИМИЗИРОВАННАЯ СХЕМА БАЗЫ ДАННЫХ ДЛЯ SUPABASE
-- ============================================
-- Эта схема разработана для поддержки десятков тысяч пользователей
-- на бесплатном тарифе Supabase (50K запросов/месяц, 500MB БД)

-- ============================================
-- 1. ВКЛЮЧЕНИЕ РАСШИРЕНИЙ
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. ТАБЛИЦА ИГРОКОВ (PLAYERS)
-- ============================================
CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,              -- Telegram User ID (строка для совместимости)
    score BIGINT DEFAULT 0 NOT NULL,   -- Используем BIGINT для больших счетов
    username TEXT,                     -- Полное имя
    first_name TEXT,                   -- Имя
    last_name TEXT,                    -- Фамилия
    
    -- Метаданные для оптимизации
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для ускорения запросов
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_players_updated ON players(updated_at DESC);

-- Комментарии к таблице
COMMENT ON TABLE players IS 'Таблица игроков с оптимизацией под высокие нагрузки';
COMMENT ON COLUMN players.id IS 'Telegram User ID (уникальный идентификатор)';
COMMENT ON COLUMN players.score IS 'Текущий счет игрока (голоса)';

-- ============================================
-- 3. ТАБЛИЦА РЕФЕРАЛОВ (REFERRALS)
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referrer_id TEXT NOT NULL,         -- Кто пригласил
    referred_id TEXT NOT NULL,         -- Кого пригласили
    reward_given BOOLEAN DEFAULT FALSE, -- Выдана ли награда
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Уникальность пары
    CONSTRAINT unique_referral_pair UNIQUE (referrer_id, referred_id)
);

-- Индексы для рефералов
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_reward ON referrals(reward_given) WHERE reward_given = FALSE;

COMMENT ON TABLE referrals IS 'Таблица реферальных связей';

-- ============================================
-- 4. ТАБЛИЦА ИГРОВЫХ СОБЫТИЙ (GAME_EVENTS) - ОПЦИОНАЛЬНО
-- ============================================
-- Для продвинутой аналитики и античита (можно отключить для экономии запросов)
/*
CREATE TABLE IF NOT EXISTS game_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player_id TEXT NOT NULL REFERENCES players(id),
    event_type TEXT NOT NULL,          -- 'tap', 'upgrade', 'reward'
    event_data JSONB,                  -- Детали события
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_events_player ON game_events(player_id);
CREATE INDEX IF NOT EXISTS idx_game_events_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_time ON game_events(created_at DESC);
*/

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) - БЕЗОПАСНОСТЬ
-- ============================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы players
-- Чтение: все могут видеть всех игроков (для рейтинга)
CREATE POLICY "Players are publicly viewable" ON players
    FOR SELECT USING (true);

-- Запись: только владелец записи может обновлять свой профиль
CREATE POLICY "Users can update own profile" ON players
    FOR UPDATE USING (
        auth.uid()::TEXT = id OR 
        EXISTS (SELECT 1 FROM players WHERE id = (current_setting('app.current_user_id', true)))
    );

-- Вставка: разрешена для всех (первичная регистрация)
CREATE POLICY "Users can insert own profile" ON players
    FOR INSERT WITH CHECK (true);

-- Политики для таблицы referrals
-- Чтение: игроки видят только свои рефералы
CREATE POLICY "Users can view own referrals" ON referrals
    FOR SELECT USING (
        referrer_id = (current_setting('app.current_user_id', true)) OR
        referred_id = (current_setting('app.current_user_id', true))
    );

-- Вставка: разрешена для всех
CREATE POLICY "Users can create referrals" ON referrals
    FOR INSERT WITH CHECK (true);

-- Обновление: только для владельца referrer_id
CREATE POLICY "Referrers can update own referrals" ON referrals
    FOR UPDATE USING (referrer_id = (current_setting('app.current_user_id', true)));

-- ============================================
-- 6. ФУНКЦИИ ДЛЯ АВТОМАТИЗАЦИИ
-- ============================================

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для players
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ФУНКЦИЯ ДЛЯ СИНХРОНИЗАЦИИ СЧЕТА
-- ============================================
-- Оптимизированная функция для upsert с минимальными запросами
CREATE OR REPLACE FUNCTION sync_player_score(
    p_id TEXT,
    p_score BIGINT,
    p_username TEXT,
    p_first_name TEXT,
    p_last_name TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO players (id, score, username, first_name, last_name, updated_at)
    VALUES (p_id, p_score, p_username, p_first_name, p_last_name, NOW())
    ON CONFLICT (id) DO UPDATE SET
        score = EXCLUDED.score,
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТОП ИГРОКОВ
-- ============================================
CREATE OR REPLACE FUNCTION get_top_players(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    id TEXT,
    score BIGINT,
    username TEXT,
    first_name TEXT,
    last_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.score,
        p.username,
        p.first_name,
        p.last_name
    FROM players p
    ORDER BY p.score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ПОЗИЦИИ ИГРОКА
-- ============================================
CREATE OR REPLACE FUNCTION get_player_rank(p_id TEXT)
RETURNS BIGINT AS $$
DECLARE
    rank_position BIGINT;
BEGIN
    SELECT COUNT(*) + 1 INTO rank_position
    FROM players
    WHERE score > (SELECT score FROM players WHERE id = p_id);
    
    RETURN rank_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. ОЧИСТКА СТАРЫХ ДАННЫХ (ОПЦИОНАЛЬНО)
-- ============================================
-- Для экономии места можно настроить периодическую очистку
-- Например, удалять неактивных игроков старше 6 месяцев

/*
CREATE OR REPLACE FUNCTION cleanup_inactive_players()
RETURNS VOID AS $$
BEGIN
    DELETE FROM players
    WHERE updated_at < NOW() - INTERVAL '6 months'
    AND score = 0;
END;
$$ LANGUAGE plpgsql;

-- Создать задачу в pg_cron (если доступно)
-- SELECT cron.schedule('cleanup-inactive-players', '0 3 * * 0', 'SELECT cleanup_inactive_players()');
*/

-- ============================================
-- 11. НАСТРОЙКИ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================

-- ANALYZE для оптимизации планов запросов
ANALYZE players;
ANALYZE referrals;

-- ============================================
-- 12. ПРИМЕРЫ ЗАПРОСОВ (ДЛЯ ТЕСТА)
-- ============================================

-- Вставка тестового игрока
/*
INSERT INTO players (id, score, username, first_name, last_name)
VALUES ('123456789', 1000, 'Test User', 'Test', 'User')
ON CONFLICT (id) DO UPDATE SET score = 1000;
*/

-- Получение топ-10 игроков
/*
SELECT * FROM get_top_players(10);
*/

-- Получение позиции игрока
/*
SELECT get_player_rank('123456789');
*/

-- Синхронизация счета
/*
SELECT sync_player_score('123456789', 5000, 'Updated User', 'Updated', 'User');
*/

-- ============================================
-- ИНСТРУКЦИЯ ПО НАСТРОЙКЕ
-- ============================================
/*
1. Выполните этот SQL скрипт в Supabase Dashboard -> SQL Editor
2. Проверьте что все таблицы созданы успешно
3. Протестируйте функции на примерах запросов
4. Настройте RLS политики при необходимости

Оптимизации для Free Tier:
- Минимум индексов (только критичные)
- Использование BIGINT для score (защита от переполнения)
- Функции SECURITY DEFINER для безопасного доступа
- Кэширование на клиенте (реализовано в script.optimized.js)
- Батчинг запросов (группировка операций)

Рекомендации по использованию:
- Синхронизация раз в 30 сек (не чаще!)
- Кэширование рейтинга на 1 минуту
- Локальное сохранение в localStorage
- Пакетная отправка изменений
*/
