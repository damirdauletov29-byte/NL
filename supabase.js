// supabase.js
const SUPABASE_URL = 'https://ваш-id.supabase.co';
const SUPABASE_ANON_KEY = 'ваш-anon-key';

const { createClient } = window.Supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Получаем telegram_id из Mini App
function getTelegramUserId() {
    const tg = window.Telegram.WebApp;
    return tg.initDataUnsafe?.user?.id || null;
}

export { supabase, getTelegramUserId };
