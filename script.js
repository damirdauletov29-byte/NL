// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0;
const energyRegenSpeed = 3;

// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ ЗАДАНИЯ ПОДПИСКИ ---
let taskSubscribedCompleted = localStorage.getItem('task_subscribed_completed') === 'true';
let taskSubscribedVisited = localStorage.getItem('task_subscribed_visited') === 'true';

// Ранги
const ranks = [
    { name: "Новичок", minScore: 0, icon: "👶" },
    { name: "Активист", minScore: 500, icon: "🌱" },
    { name: "Агитатор", minScore: 2500, icon: "📢" },
    { name: "Организатор", minScore: 10000, icon: "🤝" },
    { name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
    { name: "Политик", minScore: 150000, icon: "🏛️" },
    { name: "Лидер движения", minScore: 1000000, icon: "狮子" }
];

// Улучшения
const upgrades = [
    { id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
    { id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
    { id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
    { id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
    { id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];

// Награды
const rewards = [
    { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
    { id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '🧢' },
    { id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
    { id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
    { id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
];

// --- СИСТЕМА СОХРАНЕНИЯ ---
let randomUserId = null;

function loadGame() {
    // Генерируем/загружаем randomUserId
    randomUserId = localStorage.getItem('nl_random_user_id');
    if (!randomUserId) {
        randomUserId = crypto.randomUUID();
        localStorage.setItem('nl_random_user_id', randomUserId);
    }

    // Загрузка данных из localStorage
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedProfit = localStorage.getItem('nl_profit');
    const savedClickPower = localStorage.getItem('nl_clickPower');
    const savedUpgrades = localStorage.getItem('nl_upgrades');

    if (savedScore) score = parseInt(savedScore);
    if (savedEnergy) energy = parseInt(savedEnergy);
    if (savedProfit) profitPerHour = parseInt(savedProfit);
    if (savedClickPower) clickPower = parseInt(savedClickPower);
    if (savedUpgrades) {
        const parsed = JSON.parse(savedUpgrades);
        parsed.forEach((s, i) => { if (upgrades[i]) upgrades[i].level = s.level; });
    }

    // --- ИНТЕГРАЦИЯ SUPABASE (работает только после загрузки SDK) ---
    if (typeof window.supabase !== 'undefined') {
        const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // ЗАМЕНИТЕ
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ЗАМЕНИТЕ
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        supabase.from('users')
            .select('*')
            .eq('random_user_id', randomUserId)
            .single()
            .then(({ data, error }) => {
                if (error && error.code !== 'PGRST116') {
                    console.warn('Supabase: ошибка загрузки', error);
                } else if (!data) {
                    // Нового пользователя нет — создаём
                    supabase.from('users').insert([{ random_user_id: randomUserId, score: score }])
                        .then(() => console.log('Создан пользователь:', randomUserId));
                } else {
                    // Есть пользователь — обновляем локальный score
                    score = Math.max(score, data.score || 0);
                    console.log('Загружен пользователь:', data);
                }
                updateUI(); // После завершения Supabase — обновляем интерфейс
            });
    } else {
        // Если Supabase не загружен, просто обновляем UI
        updateUI();
    }
}

function saveGame() {
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_profit', profitPerHour);
    localStorage.setItem('nl_clickPower', clickPower);
    localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
    localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
    localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);

    // Сохраняем в Supabase, если доступен
    if (typeof window.supabase !== 'undefined' && randomUserId) {
        const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // ЗАМЕНИТЕ
        const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ЗАМЕНИТЕ
        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        supabase.from('users')
            .update({ score })
            .eq('random_user_id', randomUserId)
            .then(({ error }) => {
                if (error) console.warn('Supabase: ошибка сохранения', error);
                else console.log('Счёт сохранён для:', randomUserId);
            });
    }
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

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
    scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
    vphDisplay.textContent = `+${profitPerHour.toLocaleString('ru-RU')}/час`;
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
        energyFillEl.style.width = `${(energy / maxEnergy) * 100}%`;
    }

    let idx = 0;
    for (let i = 0; i < ranks.length; i++) if (score >= ranks[i].minScore) idx = i;
    const cur = ranks[idx], next = ranks[idx + 1];
    rankNameEl.textContent = cur.name;
    rankIconEl.textContent = cur.icon;
    levelFillEl.style.width = next ? `${((score - cur.minScore) / (next.minScore - cur.minScore)) * 100}%` : '100%';

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
        const rect = clickArea.getBoundingClientRect();
        const x = e.touches?.[0]?.clientX || e.clientX;
        const y = e.touches?.[0]?.clientY || e.clientY;
        createPopUp(x - rect.left, y - rect.top);
    }
}
function createPopUp(x, y) {
    const pop = document.createElement('div');
    pop.className = 'tap-pop';
    pop.textContent = `+${clickPower}`;
    pop.style.left = `${x - 15}px`;
    pop.style.top = `${y - 30}px`;
    clickArea.appendChild(pop);
    setTimeout(() => pop.remove(), 600);
}

// --- УЛУЧШЕНИЯ ---
function getUpgradeCost(u) { return Math.floor(u.baseCost * Math.pow(1.15, u.level)); }
function buyUpgrade(i) {
    const u = upgrades[i], cost = getUpgradeCost(u);
    if (score >= cost) {
        score -= cost;
        u.level++;
        profitPerHour += u.bonus;
        clickPower++;
        saveGame();
        updateUI();
        if (navigator.vibrate) navigator.vibrate(50);
    }
}
function renderUpgrades() {
    if (!upgradesList) return;
    upgradesList.innerHTML = '';
    upgrades.forEach((u, i) => {
        const cost = getUpgradeCost(u);
        const can = score >= cost;
        const card = document.createElement('div');
        card.className = `upgrade-card ${can ? '' : 'disabled'}`;
        card.onclick = () => can && buyUpgrade(i);
        card.innerHTML = `
            <div class="upgrade-icon">${u.icon}</div>
            <div class="upgrade-info">
                <div>${u.name} <span>Ур. ${u.level}</span></div>
                <div>+${u.bonus} голосов/час</div>
            </div>
            <div class="upgrade-cost">${cost.toLocaleString()}</div>
        `;
        upgradesList.appendChild(card);
    });
}

// --- БИРЖА ---
function claimReward(id) {
    const r = rewards.find(r => r.id === id);
    if (r && score >= r.cost) alert(`Поздравляем! Вы оформили заявку на "${r.name}".`);
    else alert('Недостаточно голосов!');
}
function renderRewards() {
    if (!rewardsList) return;
    rewardsList.innerHTML = '';
    rewards.forEach(r => {
        const can = score >= r.cost;
        rewardsList.innerHTML += `
            <div class="reward-card">
                <div class="reward-header"><span>${r.icon}</span><div><div>${r.name}</div><div>${r.desc}</div></div></div>
                <div class="reward-footer">
                    <span>${r.cost.toLocaleString()} 🗳️</span>
                    <button class="claim-reward-btn" ${!can ? 'disabled' : ''} onclick="claimReward('${r.id}')">
                        ${can ? 'Получить' : 'Недоступно'}
                    </button>
                </div>
            </div>
        `;
    });
}

// --- ЗАДАНИЯ ---
function markLinkVisited() {
    taskSubscribedVisited = true;
    saveGame();
    updateTasksUI();
    window.open('https://t.me/partynewpeople', '_blank');
}
function completeSubscribeTask() {
    if (taskSubscribedCompleted) return alert("Вы уже получали награду!");
    if (!taskSubscribedVisited) return alert("Сначала перейдите по ссылке!");
    score += 5000;
    taskSubscribedCompleted = true;
    saveGame();
    updateUI();
    alert("Поздравляем! Вы получили 5000 голосов за подписку!");
}
function renderTasks() {
    const cont = document.querySelector('#screen-tasks .placeholder-content');
    if (!cont) return;
    cont.innerHTML = '<h2>💼 Поручения</h2>';
    cont.innerHTML += `
        <div class="task-item">
            <h3>Подписаться на канал @partynewpeople</h3>
            <p>Награда: 5000 голосов</p>
            <button id="task-btn">Загрузка...</button>
            <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
        </div>
    `;
    updateTasksUI();
}
function updateTasksUI() {
    const btn = document.getElementById('task-btn');
    if (!btn) return;
    btn.disabled = taskSubscribedCompleted || (!taskSubscribedVisited && !taskSubscribedCompleted);
    btn.textContent = taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке');
}

// --- ЗАПУСК ---
document.addEventListener('DOMContentLoaded', () => {
    if (slonBtn) {
        slonBtn.addEventListener('touchstart', handleTap, { passive: false });
        slonBtn.addEventListener('mousedown', handleTap);
    }
    loadGame(); // ← Вызов здесь, после DOM загружен
});

// --- ГЛОБАЛЬНЫЕ ФУНКЦИИ ---
window.markLinkVisited = markLinkVisited;
window.completeSubscribeTask = completeSubscribeTask;
window.claimReward = claimReward;
