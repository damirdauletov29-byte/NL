// --- КОНФИГУРАЦИЯ SUPABASE ---
// ВСТАВЬТЕ СЮДА ВАШИ ДАННЫЕ ИЗ SUPABASE DASHBOARD
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'; 
const SUPABASE_KEY = 'YOUR_ANON_KEY'; 

// Подключаем клиент (предполагается, что вы подключили supabase-js через CDN в HTML или npm)
// Если используете CDN в index.html, раскомментируйте строку ниже:
// const { createClient } = supabase; 
// const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; 
const energyRegenSpeed = 3;

// Переменные для заданий
let taskSubscribedCompleted = false;
let taskSubscribedVisited = false;

// Ранги
const ranks = [
    { name: "Новичок", minScore: 0, icon: "" },
    { name: "Активист", minScore: 500, icon: "🌱" },
    { name: "Агитатор", minScore: 2500, icon: "📢" },
    { name: "Организатор", minScore: 10000, icon: "🤝" },
    { name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
    { name: "Политик", minScore: 150000, icon: "🏛️" },
    { name: "Лидер движения", minScore: 1000000, icon: "🦁" }
];

// База данных улучшений
const upgrades = [
    { id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
    { id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
    { id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '', level: 0 },
    { id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
    { id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];

// Реальные награды
const rewards = [
    { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
    { id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '' },
    { id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
    { id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
    { id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
];

// --- ЭЛЕМЕНТЫ DOM ---
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

// --- ФУНКЦИИ SUPABASE (ИМИТАЦИЯ / ЗАГОТОВКИ) ---
// В реальном проекте здесь будут запросы к sb.from('users').select() и т.д.

async function syncToSupabase() {
    console.log("Синхронизация с Supabase...");
    // Пример запроса (раскомментировать при наличии клиента):
    /*
    const { error } = await sb
        .from('users')
        .upsert({ 
            telegram_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 12345, // ID пользователя
            score: Math.floor(score),
            energy: Math.floor(energy),
            click_power: clickPower,
            profit_per_hour: profitPerHour,
            upgrades: upgrades.map(u => ({ id: u.id, level: u.level })),
            tasks_completed: { subscribed: taskSubscribedCompleted }
        });
    if (error) console.error('Ошибка сохранения:', error);
    */
}

async function loadFromSupabase() {
    console.log("Загрузка из Supabase...");
    // Пример запроса:
    /*
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!userId) return; // Если нет ID (тест в браузере), используем localStorage
    
    const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('telegram_id', userId)
        .single();

    if (data && !error) {
        score = data.score || 0;
        energy = data.energy || 1000;
        clickPower = data.click_power || 1;
        profitPerHour = data.profit_per_hour || 0;
        // Восстановление улучшений и задач...
    } else {
        // Если пользователя нет, создаем запись или используем локальные данные
        syncToSupabase(); 
    }
    */
   
    // Временно оставляем загрузку из LocalStorage для работы без бэкенда
    loadGameLocal(); 
}

// --- СИСТЕМА СОХРАНЕНИЯ (LOCAL STORAGE - КА КЭШ) ---
function loadGameLocal() {
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedProfit = localStorage.getItem('nl_profit');
    const savedClickPower = localStorage.getItem('nl_clickPower');
    const savedUpgrades = localStorage.getItem('nl_upgrades');
    const savedTaskStatusCompleted = localStorage.getItem('task_subscribed_completed');
    const savedTaskStatusVisited = localStorage.getItem('task_subscribed_visited');

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
}

function saveGameLocal() {
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_profit', profitPerHour);
    localStorage.setItem('nl_clickPower', clickPower);
    localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
    localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
    localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);
}

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
        
        // Вибрация (Haptic Feedback для Telegram)
        if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        } else if (window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }

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
        clickPower += 1; // Увеличиваем силу клика с каждым улучшением
        saveGameLocal();
        syncToSupabase(); // Синхронизируем покупку
        updateUI();
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
        alert(`Поздравляем! Вы оформили заявку на "${reward.name}". Свяжитесь с куратором.`);
        // Здесь можно добавить логику отправки заявки в Supabase
    } else {
        alert('Недостаточно голосов!');
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

// --- ЛОГИКА ЗАДАНИЙ ---
function markLinkVisited() {
    taskSubscribedVisited = true;
    saveGameLocal();
    updateTasksUI();
    window.open('https://t.me/partynewpeople', '_blank');
}

function completeSubscribeTask() {
    if (taskSubscribedCompleted) return;
    if (!taskSubscribedVisited) {
        alert("Сначала перейдите по ссылке!");
        return;
    }
    const reward = 5000;
    score += reward;
    taskSubscribedCompleted = true;
    saveGameLocal();
    syncToSupabase();
    updateUI();
    updateTasksUI();
    alert(`Получено ${reward} голосов!`);
}

function renderTasks() {
    const tasksContainer = document.querySelector('#screen-tasks .placeholder-content');
    if (!tasksContainer) return;
    tasksContainer.innerHTML = '<h2>💼 Поручения</h2>';
    
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.innerHTML = `
        <h3>Подписаться на канал @partynewpeople</h3>
        <p>Подпишитесь на наш официальный канал и получите награду!</p>
        <p>Награда: 5000 голосов</p>
        <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted ? 'disabled' : (!taskSubscribedVisited ? 'disabled' : '')}>
            ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Перейдите по ссылке')}
        </button>
        <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
    `;
    tasksContainer.appendChild(taskDiv);
}

function updateTasksUI() {
    const taskButton = document.querySelector('#screen-tasks button');
    if (taskButton) {
        taskButton.disabled = taskSubscribedCompleted || !taskSubscribedVisited;
        if (taskSubscribedCompleted) taskButton.textContent = 'Выполнено!';
        else if (taskSubscribedVisited) taskButton.textContent = 'Получить награду';
        else taskButton.textContent = 'Перейдите по ссылке';
    }
}

// --- ЛИДЕРБОРД (РЕЙТИНГ) ---
async function renderLeaderboard() {
    const leaderboardContainer = document.getElementById('rewardsList'); // Используем тот же контейнер или создадим новый
    // Для чистоты лучше создать отдельный экран, но пока выведем поверх наград или заменим их
    // Давайте сделаем замену контента на экране "Биржа", если там нет списка наград, или добавим табы.
    // Для простоты: выведем топ-10 игроков.
    
    leaderboardContainer.innerHTML = '<div style="text-align:center; padding: 20px;">Загрузка рейтинга...</div>';

    // ИМИТАЦИЯ ДАННЫХ (Замените на реальный запрос к Supabase)
    /*
    const { data, error } = await sb
        .from('leaderboard_cache')
        .select('user_id, score, region')
        .order('score', { ascending: false })
        .limit(20);
    */
   
    // Заглушка данных для демонстрации
    const mockData = [
        { user_id: 1, score: 1500000, region: 'Москва' },
        { user_id: 2, score: 980000, region: 'СПб' },
        { user_id: 3, score: 750000, region: 'Казань' },
        { user_id: 4, score: 500000, region: 'Новосибирск' },
        { user_id: 5, score: 320000, region: 'Екатеринбург' },
    ];

    let html = `<h2 style="margin-bottom: 15px; color: #00cbd6; width: 100%;"> Топ Активистов</h2>`;
    
    mockData.forEach((player, index) => {
        const isMe = player.user_id === (window.Telegram?.WebApp?.initDataUnsafe?.user?.id);
        const bgStyle = isMe ? 'border: 2px solid #00ffcc; background: rgba(0, 255, 204, 0.1);' : '';
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        html += `
        <div class="reward-card" style="${bgStyle}">
            <div class="reward-header">
                <span class="reward-icon" style="font-size: 20px; width: 30px;">${medal}</span>
                <div style="flex: 1;">
                    <div class="reward-title" style="font-size: 14px;">${isMe ? 'Вы' : 'Игрок ' + player.user_id}</div>
                    <div class="reward-desc">${player.region || 'Россия'}</div>
                </div>
                <div style="font-weight: bold; color: #00ffcc;">
                    ${player.score.toLocaleString()}
                </div>
            </div>
        </div>`;
    });

    leaderboardContainer.innerHTML = html;
}

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ---
setInterval(() => {
    if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    if (profitPerHour > 0) score += profitPerHour / 3600;
    
    updateUI();
    
    // Сохраняем в LocalStorage каждую секунду
    saveGameLocal();
    
    // Синхронизируем с Supabase реже (например, раз в 10 секунд), чтобы не спамить API
    if (Date.now() % 10000 < 1000) {
        syncToSupabase();
    }
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
                
                if (targetScreenId === 'screen-tasks') renderTasks();
                if (targetScreenId === 'screen-friends') renderLeaderboard(); // Показываем рейтинг вместо наград или вместе с ними
            }
        });
    });
});

// --- ЗАПУСК ---
if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

// Инициализация Telegram WebApp
if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

loadFromSupabase(); // Загружаем данные (сначала пробуем базу, потом локально)
updateUI();
