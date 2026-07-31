--- supabase-config.js (原始)


+++ supabase-config.js (修改后)
// === КОНФИГУРАЦИЯ SUPABASE ===
// Замените эти значения на ваши из проекта Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Инициализация Supabase клиентом (будет выполнена после загрузки скрипта)
let supabase = null;

function initSupabase() {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase инициализирован');
  } else {
    console.error('❌ Supabase библиотека не загружена');
  }
}
