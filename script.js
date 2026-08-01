// КОНФИГУРАЦИЯ SUPABASE
// 1. Зарегистрируйтесь на https://supabase.com (бесплатно)
// 2. Создайте новый проект
// 3. В Settings -> API скопируйте Project URL и anon/public key
// 4. Вставьте их ниже:
const SUPABASE_URL = 'https://fncfdimmmlqwjbsslntk.supabase.co'; // Например: 'https://xxxxx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuY2ZkaW1tbWxxd2pic3NsbnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzIzOTEsImV4cCI6MjEwMTEwODM5MX0.HoSvbTqGio8mSWCYf17o4c1FQd9C-Na8TGwWo_GmBTI'; // Начинается с 'eyJ...'

let supabase;

// Telegram WebApp
const tg = window.Telegram?.WebApp;
let telegramUser = null;
let startParam = null; // Параметр start для реферальной системы

if (tg) {
    tg.ready();
    tg.expand(); // Развернуть на весь экран
    telegramUser = tg.initDataUnsafe?.user || null;

    // Получаем параметр start из initData (для реферальной системы)
    const initData = tg.initDataUnsafe;
    if (initData && initData.start_param) {
        startParam = initData.start_param;
        console.log('Referral start_param:', startParam);
        // Здесь можно добавить логику обработки реферального кода
        // Например, сохранить кто пригласил пользователя
    }
}

// Инициализация Supabase после загрузки страницы
async function initSupabase() {
    if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_KEY !== 'YOUR_SUPABASE_KEY') {
        try {
            // Динамический импорт клиента Supabase
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
            supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase успешно подключен');
        } catch (e) {
            console.log('Не удалось подключить Supabase:', e.message);
        }
    } else {
        console.log('Supabase не настроен. Используйте демо-режим.');
    }
}

// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; // Голосов в час
const energyRegenSpeed = 3;
let lastLoginTime = Date.now(); // Время последнего входа/выхода
// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ ЗАДАНИЯ ПОДПИСКИ ---
let taskSubscribedCompleted = localStorage.getItem('task_subscribed_completed') === 'true';
let taskSubscribedVisited = localStorage.getItem('task_subscribed_visited') === 'true';
// --- ПЕРЕМЕННЫЕ ДЛЯ РЕФЕРАЛЬНОЙ СИСТЕМЫ ---
let taskInviteCompleted = localStorage.getItem('task_invite_completed') === 'true';
let invitedFriends = parseInt(localStorage.getItem('invited_friends') || '0');
let referralCode = localStorage.getItem('referral_code') || null;

// Ранги
const ranks = [
{ name: "Новичок", minScore: 0, icon: "👶" },
{ name: "Активист", minScore: 500, icon: "🌱" },
{ name: "Агитатор", minScore: 2500, icon: "📢" },
{ name: "Организатор", minScore: 10000, icon: "🤝" },
{ name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
{ name: "Политик", minScore: 150000, icon: "🏛️" },
{ name: "Лидер движения", minScore: 1000000, icon: "👑" }
];
// База данных улучшений
const upgrades = [
{ id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
{ id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
{ id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
{ id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
{ id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];
// Реальные награды (Биржа Лидеров)
const rewards = [
{ id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
{ id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '🧢' },
{ id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
{ id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
{ id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
];

// --- СИСТЕМА СОХРАНЕНИЯ ---
function loadGame() {
const savedScore = localStorage.getItem('nl_score');
const savedEnergy = localStorage.getItem('nl_energy');
const savedProfit = localStorage.getItem('nl_profit');
const savedClickPower = localStorage.getItem('nl_clickPower');
const savedUpgrades = localStorage.getItem('nl_upgrades');
const savedLastLoginTime = localStorage.getItem('nl_lastLoginTime');
// --- ЗАГРУЗКА СТАТУСОВ ЗАДАНИЯ ---
const savedTaskStatusCompleted = localStorage.getItem('task_subscribed_completed');
const savedTaskStatusVisited = localStorage.getItem('task_subscribed_visited');
// --- ЗАГРУЗКА РЕФЕРАЛЬНОЙ СИСТЕМЫ ---
const savedTaskInviteCompleted = localStorage.getItem('task_invite_completed');
const savedInvitedFriends = localStorage.getItem('invited_friends');
const savedReferralCode = localStorage.getItem('referral_code');
if (savedScore) score = parseInt(savedScore);
if (savedEnergy) energy = parseInt(savedEnergy);
if (savedProfit) profitPerHour = parseInt(savedProfit);
if (savedClickPower) clickPower = parseInt(savedClickPower);
if (savedUpgrades) {
const parsedUpgrades = JSON.parse(savedUpgrades);
parsedUpgrades.forEach((saved, index) => {
if (upgrades[index]) upgrades[index].level = saved.level;
});
}
if (savedTaskStatusCompleted) taskSubscribedCompleted = savedTaskStatusCompleted === 'true';
if (savedTaskStatusVisited) taskSubscribedVisited = savedTaskStatusVisited === 'true';
if (savedTaskInviteCompleted) taskInviteCompleted = savedTaskInviteCompleted === 'true';
if (savedInvitedFriends) invitedFriends = parseInt(savedInvitedFriends);
if (savedReferralCode) referralCode = savedReferralCode;

// --- ВОССТАНОВЛЕНИЕ ЭНЕРГИИ ЗА ВРЕМЯ ОТСУТСТВИЯ ---
if (savedLastLoginTime) {
    const now = Date.now();
    const timeAway = now - parseInt(savedLastLoginTime); // время в миллисекундах
    const secondsAway = Math.floor(timeAway / 1000);
    const regeneratedEnergy = secondsAway * energyRegenSpeed;
    energy = Math.min(maxEnergy, energy + regeneratedEnergy);
    console.log(`Прошло времени: ${secondsAway} сек. Восстановлено энергии: ${regeneratedEnergy}`);
}
lastLoginTime = Date.now();
}
function saveGame() {
localStorage.setItem('nl_score', score);
localStorage.setItem('nl_energy', energy);
localStorage.setItem('nl_profit', profitPerHour);
localStorage.setItem('nl_clickPower', clickPower);
localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
localStorage.setItem('nl_lastLoginTime', lastLoginTime);
// --- СОХРАНЕНИЕ СТАТУСОВ ЗАДАНИЯ ---
localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);
// --- СОХРАНЕНИЕ РЕФЕРАЛЬНОЙ СИСТЕМЫ ---
localStorage.setItem('task_invite_completed', taskInviteCompleted);
localStorage.setItem('invited_friends', invitedFriends);
localStorage.setItem('referral_code', referralCode);
}

// Элементы DOM
const scoreEl = document.getElementById('score');
const vphDisplay = document.getElementById('vphDisplay');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const rankNameEl = document.getElementById('rankName');
const rankIconEl = document.getElementById('rankIcon');
const levelFillEl = document.getElementById('levelFill');
const upgradesList = document.getElementById('upgradesList');
const rewardsList = document.getElementById('rewardsList');
const leaderboardList = document.getElementById('leaderboardList');

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
vphDisplay.textContent = `+${profitPerHour.toLocaleString('ru-RU')}/час`;
if (energyTextEl && energyFillEl) {
energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
const percentage = (energy / maxEnergy) * 100;
energyFillEl.style.width = `${percentage}%`;
}
// Обновление ранга
let currentRankIndex = 0;
for (let i = 0; i < ranks.length; i++) {
if (score >= ranks[i].minScore) currentRankIndex = i;
else break;
}
const currentRank = ranks[currentRankIndex];
const nextRank = ranks[currentRankIndex + 1];
rankNameEl.textContent = currentRank.name;
rankIconEl.textContent = currentRank.icon;
if (nextRank) {
const progress = ((score - currentRank.minScore) / (nextRank.minScore - currentRank.minScore)) * 100;
levelFillEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
} else {
levelFillEl.style.width = '100%';
}
renderUpgrades();
renderRewards();
}

// --- ЛОГИКА ТАПА ---
function handleTap(e) {
e.preventDefault();
if (energy >= clickPower) {
score += clickPower;
energy -= clickPower;
updateUI();
let clientX, clientY;
if (e.touches && e.touches.length > 0) {
clientX = e.touches[e.touches.length - 1].clientX;
clientY = e.touches[e.touches.length - 1].clientY;
} else {
clientX = e.clientX;
clientY = e.clientY;
}
createPopUp(clientX, clientY);
}
}
function createPopUp(x, y) {
const pop = document.createElement('div');
pop.classList.add('tap-pop');
pop.textContent = `+${clickPower}`;
const rect = clickArea.getBoundingClientRect();
pop.style.left = `${x - rect.left - 15}px`;
pop.style.top = `${y - rect.top - 30}px`;
clickArea.appendChild(pop);
setTimeout(() => { pop.remove(); }, 600);
}

// --- СИСТЕМА УЛУЧШЕНИЙ ---
function getUpgradeCost(upgrade) {
return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.level));
}
function buyUpgrade(index) {
const upgrade = upgrades[index];
const cost = getUpgradeCost(upgrade);
if (score >= cost) {
score -= cost;
upgrade.level++;
profitPerHour += upgrade.bonus;
clickPower += 1;
saveGame();
updateUI();
if (window.navigator.vibrate) window.navigator.vibrate(50);
}
}
function renderUpgrades() {
if (!upgradesList) return;
upgradesList.innerHTML = '';
upgrades.forEach((upgrade, index) => {
const cost = getUpgradeCost(upgrade);
const canBuy = score >= cost;
const card = document.createElement('div');
card.className = `upgrade-card ${canBuy ? '' : 'disabled'}`;
card.onclick = () => { if (canBuy) buyUpgrade(index); };
card.innerHTML = `
<div class="upgrade-icon">${upgrade.icon}</div>
<div class="upgrade-info">
<div class="upgrade-name">${upgrade.name} <span style="font-size:10px; opacity:0.7">Ур. ${upgrade.level}</span></div>
<div class="upgrade-bonus">+${upgrade.bonus} голосов/час</div>
</div>
<div class="upgrade-cost">${cost.toLocaleString('ru-RU')}</div>
`;
upgradesList.appendChild(card);
});
}

// --- ЛОГИКА БИРЖИ ---
function claimReward(id) {
const reward = rewards.find(r => r.id === id);
if (reward && score >= reward.cost) {
alert(`Поздравляем! Вы оформили заявку на "${reward.name}". Свяжитесь с куратором для получения.`);
} else {
alert('Недостаточно голосов для получения этой награды!');
}
}
function renderRewards() {
if (!rewardsList) return;
rewardsList.innerHTML = '';
rewards.forEach(reward => {
const canClaim = score >= reward.cost;
const card = document.createElement('div');
card.className = 'reward-card';
card.innerHTML = `
<div class="reward-header">
<span class="reward-icon">${reward.icon}</span>
<div>
<div class="reward-title">${reward.name}</div>
<div class="reward-desc">${reward.desc}</div>
</div>
</div>
<div class="reward-footer">
<span class="reward-cost">${reward.cost.toLocaleString()} 🗳️</span>
<button class="claim-reward-btn" ${canClaim ? '' : 'disabled'} onclick="claimReward('${reward.id}')">
${canClaim ? 'Получить' : 'Недоступно'}
</button>
</div>
`;
rewardsList.appendChild(card);
});
}

// --- ЛОГИКА РЕЙТИНГА (Leaderboard) ---

// Функция для получения аватара по ID пользователя (используем первую букву имени)
function getAvatarForUser(user) {
    const avatars = ['🦁', '🐯', '🦅', '🐺', '🦊', '🐻', '🐼', '🐨', '🐸', '🐙', '🦄', '🐲', '🐘', '🦉', '🦋'];
    if (user.first_name) {
        const charCode = user.first_name.charCodeAt(0);
        return avatars[charCode % avatars.length];
    }
    return '👤';
}

// Функция для загрузки и отображения рейтинга из Supabase
async function renderLeaderboard() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '<p style="text-align:center; opacity:0.7;">Загрузка...</p>';

    let allPlayers = [];

    // Пытаемся загрузить данные из Supabase
    if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
        try {
            // Загружаем топ игроков
            const { data: topPlayers, error } = await supabase
                .from('players')
                .select('*')
                .order('score', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Ошибка загрузки рейтинга:', error);
            } else if (topPlayers) {
                allPlayers = topPlayers.map(p => ({
                    id: p.id,
                    name: p.username || p.first_name || 'Игрок',
                    score: p.score || 0,
                    avatar: getAvatarForUser(p),
                    isMe: false
                }));
            }
        } catch (e) {
            console.log('Не удалось загрузить рейтинг из базы, используем демо-режим');
        }
    }

    // Если данных нет или Supabase не настроен, используем демо-данные
    if (allPlayers.length === 0) {
        const leaderboardData = [
            { name: "Алексей М.", score: 2500000, avatar: "🦁" },
            { name: "Дмитрий К.", score: 1800000, avatar: "🐯" },
            { name: "Мария С.", score: 1200000, avatar: "🦅" },
            { name: "Иван П.", score: 850000, avatar: "🐺" },
            { name: "Елена В.", score: 620000, avatar: "🦊" },
            { name: "Сергей Н.", score: 450000, avatar: "🐻" },
            { name: "Анна Т.", score: 320000, avatar: "🐼" },
            { name: "Максим Р.", score: 210000, avatar: "🐨" },
            { name: "Ольга Д.", score: 150000, avatar: "🐸" },
            { name: "Павел Г.", score: 95000, avatar: "🐙" }
        ];
        allPlayers = leaderboardData.map(p => ({ ...p, isMe: false }));
    }

    // Добавляем текущего игрока
    const currentPlayerName = telegramUser
        ? (telegramUser.first_name + ' ' + (telegramUser.last_name || '')).trim()
        : 'Вы';
    const currentPlayerId = telegramUser ? telegramUser.id.toString() : null;
    const currentPlayer = {
        id: currentPlayerId,
        name: currentPlayerName,
        score: Math.floor(score),
        avatar: telegramUser ? getAvatarForUser(telegramUser) : '🐘',
        isMe: true
    };

    // Объединяем и сортируем
    const combinedPlayers = [...allPlayers, currentPlayer];
    const sortedPlayers = combinedPlayers.sort((a, b) => b.score - a.score);

    // Удаляем дубликаты текущего игрока по ID
    const uniquePlayers = [];
    const seenIds = new Set();

    for (const player of sortedPlayers) {
        // Если это текущий игрок (по ID или по флагу isMe)
        if (player.isMe || (currentPlayerId && player.id === currentPlayerId)) {
            // Добавляем только один раз с флагом isMe
            if (!seenIds.has('me')) {
                const mePlayer = { ...player, isMe: true };
                uniquePlayers.push(mePlayer);
                seenIds.add('me');
            }
        } else if (player.id && !seenIds.has(player.id)) {
            // Другие игроки - по их ID
            uniquePlayers.push(player);
            seenIds.add(player.id);
        } else if (!player.id) {
            // Демо-игроки без ID
            uniquePlayers.push(player);
        }
    }

    // Ограничиваем до топ-50 + текущий игрок
    const displayPlayers = uniquePlayers.slice(0, 51);

    // Рендерим список
    leaderboardList.innerHTML = '';
    displayPlayers.forEach((player, index) => {
        const rank = index + 1;
        const card = document.createElement('div');
        card.className = 'leaderboard-item';
        if (rank === 1) card.classList.add('top-1');
        if (rank === 2) card.classList.add('top-2');
        if (rank === 3) card.classList.add('top-3');
        if (player.isMe) card.classList.add('leaderboard-me');

        card.innerHTML = `
        <div class="leaderboard-rank">${rank}</div>
        <div class="leaderboard-avatar">${player.avatar}</div>
        <div class="leaderboard-info">
        <div class="leaderboard-name">${player.name}${player.isMe ? ' (Вы)' : ''}</div>
        <div class="leaderboard-score">${player.score.toLocaleString('ru-RU')} 🗳️</div>
        </div>
        `;
        leaderboardList.appendChild(card);
    });
}

// Функция для сохранения результата игрока в базу
async function saveScoreToDatabase() {
    if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !telegramUser) {
        return; // Supabase не настроен или пользователь не из Telegram
    }

    try {
        const playerId = telegramUser.id.toString();
        const username = (telegramUser.first_name + ' ' + (telegramUser.last_name || '')).trim();

        // Проверяем, существует ли уже игрок
        const { data: existingPlayer } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single();

        if (existingPlayer) {
            // Обновляем существующего игрока
            await supabase
                .from('players')
                .update({
                    score: Math.floor(score),
                    username: username,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    updated_at: new Date().toISOString()
                })
                .eq('id', playerId);
        } else {
            // Создаем нового игрока
            await supabase
                .from('players')
                .insert([{
                    id: playerId,
                    score: Math.floor(score),
                    username: username,
                    first_name: telegramUser.first_name,
                    last_name: telegramUser.last_name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);
        }
    } catch (e) {
        console.error('Ошибка сохранения в базу:', e);
    }
}

// --- ЛОГИКА ЗАДАНИЙ (TASKS) ---

function markLinkVisited() {
    taskSubscribedVisited = true;
    saveGame();
    updateTasksUI(); // Обновить состояние кнопки
    // Открываем ссылку в новой вкладке/окне
    window.open('https://t.me/partynewpeople', '_blank');
}

function completeSubscribeTask() {
    if (taskSubscribedCompleted) {
        alert("Вы уже получали награду за подписку!");
        return;
    }
    if (!taskSubscribedVisited) {
        alert("Сначала перейдите по ссылке на канал!");
        return;
    }
    // Предполагаем, что награда составляет 5000 голосов
    const reward = 5000;
    score += reward;
    taskSubscribedCompleted = true; // Отмечаем, что задание выполнено
    saveGame(); // Убедиться, что изменения сохранены
    updateUI(); // Обновить интерфейс игры (счет)
    updateTasksUI(); // Обновить интерфейс заданий (кнопку)
    alert(`Поздравляем! Вы получили ${reward} голосов за подписку на канал @partynewpeople!`);
}

// --- ФУНКЦИИ ДЛЯ РЕФЕРАЛЬНОЙ СИСТЕМЫ ---

// Генерация реферального кода (используем ID пользователя или случайную строку)
function getReferralCode() {
    if (referralCode) return referralCode;

    if (telegramUser && telegramUser.id) {
        referralCode = 'ref_' + telegramUser.id;
    } else {
        // Генерируем случайный код
        referralCode = 'ref_' + Math.random().toString(36).substring(2, 10);
    }
    saveGame();
    return referralCode;
}

// Создание реферальной ссылки для Telegram
function getReferralLink() {
    const code = getReferralCode();
    const botUsername = 'NewPeopleGameBot'; // Замените на имя вашего бота
    return `https://t.me/${botUsername}?start=${code}`;
}

// Приглашение друга через Telegram WebApp
function inviteFriend() {
    if (tg && tg.switchInlineQuery) {
        // Используем встроенную функцию Telegram для шаринга
        const referralLink = getReferralLink();
        tg.switchInlineQuery(`Приглашаю тебя в игру "Тапай за Новых"! 🐘\nЗарабатывай голоса и получай крутые награды!\n\nМоя реферальная ссылка: ${referralLink}`);
    } else {
        // Альтернативный способ - открыть окно шеринга
        const referralLink = getReferralLink();
        const shareText = encodeURIComponent(`Приглашаю тебя в игру "Тапай за Новых"! 🐘\nЗарабатывай голоса и получай крутые награды!\n\nТвоя ссылка: ${referralLink}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${shareText}`, '_blank');
    }
}

// Проверка реферального кода при старте (кто пригласил текущего пользователя)
async function checkReferralOnStart() {
    if (!startParam || !supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        return;
    }

    try {
        // Извлекаем ID реферера из start_param (формат: ref_123456789)
        const referrerId = startParam.replace('ref_', '');

        // Проверяем, не обрабатывали ли мы уже этот реферальный код
        const alreadyProcessed = localStorage.getItem('referral_processed_' + startParam);
        if (alreadyProcessed) {
            return;
        }

        // Проверяем, существует ли реферер в базе
        const { data: referrer } = await supabase
            .from('players')
            .select('id')
            .eq('id', referrerId)
            .single();

        if (referrer && telegramUser && telegramUser.id) {
            const currentUserId = telegramUser.id.toString();

            // Проверяем, не был ли уже записан этот реферал
            const { data: existingReferral } = await supabase
                .from('referrals')
                .select('*')
                .eq('referred_id', currentUserId)
                .single();

            if (!existingReferral) {
                // Записываем реферала
                await supabase
                    .from('referrals')
                    .insert([{
                        referrer_id: referrerId,
                        referred_id: currentUserId,
                        reward_given: false
                    }]);

                console.log('Реферал успешно записан:', referrerId, '->', currentUserId);
            }
        }

        // Помечаем, что обработали этот реферальный код
        localStorage.setItem('referral_processed_' + startParam, 'true');
    } catch (e) {
        console.error('Ошибка обработки реферального кода:', e);
    }
}

// Проверка и начисление награды за приглашение друга
async function completeInviteTask() {
    if (taskInviteCompleted) {
        alert("Вы уже получили награду за это задание!");
        return;
    }

    let newInvitedCount = invitedFriends;
    let rewardGiven = 0;

    // Если есть Supabase, проверяем рефералов в базе
    if (supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && telegramUser) {
        try {
            const currentUserId = telegramUser.id.toString();

            // Получаем всех рефералов текущего пользователя
            const { data: referrals, error } = await supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', currentUserId);

            if (error) {
                console.error('Ошибка загрузки рефералов:', error);
            } else if (referrals) {
                // Считаем количество рефералов, за которые еще не выдали награду
                const newReferrals = referrals.filter(r => !r.reward_given);

                if (newReferrals.length > 0) {
                    const rewardPerFriend = 10000;
                    rewardGiven = newReferrals.length * rewardPerFriend;
                    score += rewardGiven;
                    newInvitedCount = referrals.length;

                    // Помечаем все рефералы как оплаченные
                    for (const referral of newReferrals) {
                        await supabase
                            .from('referrals')
                            .update({ reward_given: true })
                            .eq('id', referral.id);
                    }

                    taskInviteCompleted = true;
                    saveGame();
                    updateUI();
                    updateTasksUI();
                    alert(`🎉 Поздравляем! Вы пригласили ${newReferrals.length} друг(а/ей) и получили ${rewardGiven.toLocaleString()} голосов!`);
                    return;
                } else {
                    alert('❌ У вас пока нет новых приглашенных друзей. Отправьте ссылку другу и дождитесь, пока он начнет играть!');
                    return;
                }
            }
        } catch (e) {
            console.error('Ошибка проверки рефералов:', e);
            alert('Ошибка проверки рефералов. Попробуйте позже.');
            return;
        }
    }

    // Демо-режим (если нет Supabase) - показываем сообщение что нужна база данных
    alert('⚠️ Для работы реферальной системы необходимо настроить базу данных Supabase.\n\nВ демо-режиме награда не может быть начислена автоматически. Подключите Supabase для полноценной работы!');
}

// Загрузка количества приглашенных друзей из базы
async function loadInvitedFriendsFromDB() {
    if (!supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL' || !telegramUser) {
        return;
    }

    try {
        const currentUserId = telegramUser.id.toString();

        const { data: referrals, error } = await supabase
            .from('referrals')
            .select('*')
            .eq('referrer_id', currentUserId);

        if (error) {
            console.error('Ошибка загрузки рефералов:', error);
        } else if (referrals) {
            invitedFriends = referrals.length;
            saveGame();
            updateTasksUI();
        }
    } catch (e) {
        console.error('Ошибка загрузки рефералов:', e);
    }
}

// Функция для отображения заданий (заменяет заглушку)
function renderTasks() {
    const tasksContainer = document.querySelector('#screen-tasks .placeholder-content'); // Найдем контейнер внутри экрана задач
    if (!tasksContainer) return;

    // Очистим контейнер задач, если он не пуст (например, если туда была вставлена заглушка)
    tasksContainer.innerHTML = '<h2>💼 Поручения</h2>'; // Оставим заголовок

    // Задание 1: Подписка на канал
    const subscribeTaskDiv = document.createElement('div');
    subscribeTaskDiv.className = 'task-item';
    subscribeTaskDiv.innerHTML = `
        <h3>Подписаться на канал @partynewpeople</h3>
        <p>Подпишитесь на наш официальный канал и получите награду!</p>
        <p>Награда: 5000 голосов</p>
        <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted || (!taskSubscribedVisited && taskSubscribedCompleted) ? 'disabled' : ''}>
            ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке')}
        </button>
        <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
    `;
    tasksContainer.appendChild(subscribeTaskDiv);

    // Задание 2: Пригласить друга
    const inviteTaskDiv = document.createElement('div');
    inviteTaskDiv.className = 'task-item';
    const referralLink = getReferralLink();
    inviteTaskDiv.innerHTML = `
        <h3>👥 Пригласить друга</h3>
        <p>Пригласи друга в игру "Тапай за Новых" и получи бонус!</p>
        <p>Награда: 10000 голосов за каждого друга</p>
        <p style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Приглашено друзей: ${invitedFriends}</p>
        <p style="font-size: 10px; opacity: 0.5; margin-top: 3px; word-break: break-all;">${referralLink}</p>
        <button onclick="inviteFriend()" style="margin-top: 8px; background: #00ffcc;">📤 Поделиться ссылкой</button>
        <button onclick="completeInviteTask()" ${taskInviteCompleted ? 'disabled' : ''} style="margin-top: 5px; background: ${taskInviteCompleted ? '#cccccc' : '#4CAF50'};">
            ${taskInviteCompleted ? '✅ Награда получена!' : '💰 Проверить и получить награду'}
        </button>
    `;
    tasksContainer.appendChild(inviteTaskDiv);

    // Здесь можно добавить другие задания аналогично в будущем
}

// Функция для обновления UI заданий (например, кнопки)
function updateTasksUI() {
    const taskButtons = document.querySelectorAll('#screen-tasks button');
    const taskLink = document.querySelector('#screen-tasks a');

    // Обновляем кнопку подписки (первая кнопка)
    if (taskButtons.length > 0) {
        const subscribeButton = taskButtons[0];
        subscribeButton.disabled = taskSubscribedCompleted || (!taskSubscribedVisited && !taskSubscribedCompleted);
        if (taskSubscribedCompleted) {
            subscribeButton.textContent = 'Выполнено!';
        } else if (taskSubscribedVisited) {
            subscribeButton.textContent = 'Получить награду';
        } else {
            subscribeButton.textContent = 'Сначала перейдите по ссылке';
        }
    }

    // Обновляем кнопку приглашения друга (третья кнопка, если есть)
    if (taskButtons.length > 2) {
        const inviteShareButton = taskButtons[1];
        const inviteCompleteButton = taskButtons[2];

        if (inviteCompleteButton) {
            inviteCompleteButton.disabled = taskInviteCompleted;
            if (taskInviteCompleted) {
                inviteCompleteButton.textContent = '✅ Награда получена!';
                inviteCompleteButton.style.background = '#cccccc';
            } else {
                inviteCompleteButton.textContent = '💰 Проверить и получить награду';
                inviteCompleteButton.style.background = '#4CAF50';
            }
        }
    }

    // Ссылка не требует обновления в данном случае, но можно добавить стили, если посещена
    if (taskLink) {
        // taskLink.style.opacity = taskSubscribedVisited ? '0.7' : '1'; // Пример стилизации
    }
}

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ---
setInterval(() => {
if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
if (profitPerHour > 0) score += profitPerHour / 3600;
updateUI();
saveGame();
}, 1000);

// --- НАВИГАЦИЯ ---
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');
navItems.forEach(item => {
item.addEventListener('click', () => {
navItems.forEach(nav => nav.classList.remove('active'));
item.classList.add('active');
const targetScreenId = item.getAttribute('data-screen');
screens.forEach(screen => {
screen.classList.remove('active');
if (screen.id === targetScreenId) {
    screen.classList.add('active');
    if (targetScreenId === 'screen-tasks') {
        renderTasks();
    }
    if (targetScreenId === 'screen-leaderboard') {
        renderLeaderboard();
    }
}
});
});
});

// --- ЗАПУСК ---
if (slonBtn) {
slonBtn.addEventListener('touchstart', handleTap, { passive: false });
slonBtn.addEventListener('mousedown', handleTap);
}
loadGame();
updateUI();

// Инициализация Supabase при запуске
initSupabase();

// Периодическое сохранение в базу данных (каждые 5 секунд)
setInterval(() => {
    saveScoreToDatabase();
}, 5000);

// Сохраняем при закрытии/сворачивании приложения
window.addEventListener('beforeunload', () => {
    saveScoreToDatabase();
});

// Сохраняем при переключении вкладок
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        saveScoreToDatabase();
    }
});

// Обновляем lastLoginTime при выходе из приложения
window.addEventListener('beforeunload', () => {
    localStorage.setItem('nl_lastLoginTime', Date.now());
});

// --- ОБРАБОТКА РЕФЕРАЛОВ ПРИ ЗАПУСКЕ ---
// Проверяем, пришел ли пользователь по реферальной ссылке
setTimeout(() => {
    checkReferralOnStart();
    loadInvitedFriendsFromDB();
}, 1000);
