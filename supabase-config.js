--- supabase-config.js (原始)


+++ supabase-config.js (修改后)
// === КОНФИГУРАЦИЯ SUPABASE ===
// Замените эти значения на ваши из проекта Supabase
const SUPABASE_URL = 'https://ckppbsddgmqpmwppwujh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrcHBic2RkZ21xcG13cHB3dWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1Mjc2MzYsImV4cCI6MjEwMTEwMzYzNn0.RCNjYdie4EmB58aVXGC2YlELUsl3wC3PtYgNMmmadvE';

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
