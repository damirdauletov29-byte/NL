--- script.js (原始)
// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; // Голосов в час
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
// --- ЗАГРУЗКА СТАТУСОВ ЗАДАНИЯ ---
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
function saveGame() {
localStorage.setItem('nl_score', score);
localStorage.setItem('nl_energy', energy);
localStorage.setItem('nl_profit', profitPerHour);
localStorage.setItem('nl_clickPower', clickPower);
localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
// --- СОХРАНЕНИЕ СТАТУСОВ ЗАДАНИЯ ---
localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);
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

// Функция для отображения заданий (заменяет заглушку)
function renderTasks() {
    const tasksContainer = document.querySelector('#screen-tasks .placeholder-content'); // Найдем контейнер внутри экрана задач
    if (!tasksContainer) return;

    // Очистим контейнер задач, если он не пуст (например, если туда была вставлена заглушка)
    tasksContainer.innerHTML = '<h2>💼 Поручения</h2>'; // Оставим заголовок

    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item'; // Добавьте класс для стилизации, если нужно
    taskDiv.innerHTML = `
        <h3>Подписаться на канал @partynewpeople</h3>
        <p>Подпишитесь на наш официальный канал и получите награду!</p>
        <p>Награда: 5000 голосов</p>
        <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted || (!taskSubscribedVisited && taskSubscribedCompleted) ? 'disabled' : ''}>
            ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке')}
        </button>
        <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
    `;
    tasksContainer.appendChild(taskDiv);

    // Здесь можно добавить другие задания аналогично в будущем
}

// Функция для обновления UI заданий (например, кнопки)
function updateTasksUI() {
    const taskButton = document.querySelector('#screen-tasks button');
    const taskLink = document.querySelector('#screen-tasks a');
    if (taskButton) {
        // Кнопка неактивна, если задание выполнено ИЛИ если ссылка не посещена, но задание не выполнено
        taskButton.disabled = taskSubscribedCompleted || (!taskSubscribedVisited && !taskSubscribedCompleted);
        if (taskSubscribedCompleted) {
            taskButton.textContent = 'Выполнено!';
        } else if (taskSubscribedVisited) {
            taskButton.textContent = 'Получить награду';
        } else {
            taskButton.textContent = 'Сначала перейдите по ссылке';
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
    // --- ДОБАВЬТЕ ЭТИ СТРОКИ ---
    if (targetScreenId === 'screen-tasks') {
        renderTasks(); // Перерисовать задания при открытии экрана
    }
    // ---
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

+++ script.js (修改后)
// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; // Голосов в час
const energyRegenSpeed = 3;

// Данные пользователя Telegram
let telegramUser = null;
let telegramId = null;

// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ---
function initTelegramUser() {
  if (window.Telegram && window.Telegram.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      telegramUser = {
        id: user.id,
        // Не сохраняем личные данные, только ID
        displayName: 'Игрок #' + user.id
      };
      telegramId = user.id;
      console.log('✅ Пользователь Telegram (анонимно):', telegramUser);
    } else {
      // Если открыто не в Telegram, создаем тестового пользователя
      telegramId = 'test_' + Math.floor(Math.random() * 1000000);
      telegramUser = {
        id: telegramId,
        displayName: 'Гость'
      };
      console.log('⚠️ Тестовый пользователь:', telegramUser);
    }
  } else {
    // Если SDK Telegram не загружен
    telegramId = 'test_' + Math.floor(Math.random() * 1000000);
    telegramUser = {
      id: telegramId,
      displayName: 'Гость'
    };
    console.log('⚠️ Telegram WebApp не доступен, используем тестового пользователя');
  }
}

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
// --- ЗАГРУЗКА СТАТУСОВ ЗАДАНИЯ ---
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
function saveGame() {
localStorage.setItem('nl_score', score);
localStorage.setItem('nl_energy', energy);
localStorage.setItem('nl_profit', profitPerHour);
localStorage.setItem('nl_clickPower', clickPower);
localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
// --- СОХРАНЕНИЕ СТАТУСОВ ЗАДАНИЯ ---
localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);
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

// Функция сохранения результата игрока в базу данных
async function savePlayerScore() {
  if (!supabase || !telegramId) {
    console.log('⚠️ Supabase или telegramId не доступны, сохраняем локально');
    return;
  }

  try {
    // Используем только displayName, который содержит "Игрок #ID"
    const playerName = telegramUser?.displayName || 'Игрок';
    const avatar = '🐘'; // Единый аватар для всех для анонимности

    // Проверяем, есть ли уже запись этого игрока
    const { data: existingPlayer, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = нет записей
      console.error('Ошибка при поиске игрока:', fetchError);
      return;
    }

    if (existingPlayer) {
      // Обновляем существующую запись
      const { error: updateError } = await supabase
        .from('leaderboard')
        .update({
          score: Math.floor(score),
          username: playerName,
          last_updated: new Date().toISOString()
        })
        .eq('telegram_id', telegramId);

      if (updateError) {
        console.error('Ошибка при обновлении счета:', updateError);
      } else {
        console.log('✅ Счет обновлен в базе данных');
      }
    } else {
      // Создаем новую запись - БЕЗ персональных данных
      const { error: insertError } = await supabase
        .from('leaderboard')
        .insert([{
          telegram_id: telegramId,
          username: playerName,
          first_name: '', // Не сохраняем имя
          score: Math.floor(score),
          avatar: avatar,
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Ошибка при создании записи:', insertError);
      } else {
        console.log('✅ Игрок добавлен в базу данных');
      }
    }
  } catch (error) {
    console.error('Ошибка при сохранении счета:', error);
  }
}

// Функция получения рейтинга из базы данных
async function fetchLeaderboard() {
  if (!supabase) {
    console.log('⚠️ Supabase не доступен, используем демо-данные');
    return leaderboardData;
  }

  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(50); // Топ 50 игроков

    if (error) {
      console.error('Ошибка при получении рейтинга:', error);
      return leaderboardData; // Возвращаем демо-данные при ошибке
    }

    console.log('✅ Рейтинг загружен из базы:', data?.length || 0, 'игроков');
    return data || [];
  } catch (error) {
    console.error('Ошибка при загрузке рейтинга:', error);
    return leaderboardData;
  }
}

// Демо-данные для рейтинга (используются если база недоступна)
const leaderboardData = [
{ name: "Игрок #12345", score: 2500000, avatar: "🐘" },
{ name: "Игрок #67890", score: 1800000, avatar: "🐘" },
{ name: "Игрок #11111", score: 1200000, avatar: "🐘" },
{ name: "Игрок #22222", score: 850000, avatar: "🐘" },
{ name: "Игрок #33333", score: 620000, avatar: "🐘" },
{ name: "Игрок #44444", score: 450000, avatar: "🐘" },
{ name: "Игрок #55555", score: 320000, avatar: "🐘" },
{ name: "Игрок #66666", score: 210000, avatar: "🐘" },
{ name: "Игрок #77777", score: 150000, avatar: "🐘" },
{ name: "Игрок #88888", score: 95000, avatar: "🐘" }
];

async function renderLeaderboard() {
if (!leaderboardList) return;
leaderboardList.innerHTML = '<p style="text-align:center;opacity:0.7;">Загрузка...</p>';

// Получаем данные из базы
const players = await fetchLeaderboard();

// Добавляем текущего игрока в рейтинг
const currentPlayerName = telegramUser?.displayName || 'Вы';
const currentPlayer = {
  username: currentPlayerName,
  first_name: '', // Не используем персональные данные
  score: Math.floor(score),
  telegram_id: telegramId,
  isMe: true
};

// Объединяем и сортируем
const allPlayers = [...players, currentPlayer]
  .filter((player, index, self) =>
    index === self.findIndex(p => p.telegram_id === player.telegram_id)
  ) // Убираем дубликаты
  .sort((a, b) => b.score - a.score);

leaderboardList.innerHTML = '';

allPlayers.forEach((player, index) => {
const rank = index + 1;
const displayName = player.isMe
  ? `${player.username || 'Игрок'} (Вы)`
  : `${player.username || 'Игрок'}`;
const displayAvatar = player.avatar || '🐘'; // Единый аватар для анонимности

const card = document.createElement('div');
card.className = 'leaderboard-item';
if (rank === 1) card.classList.add('top-1');
if (rank === 2) card.classList.add('top-2');
if (rank === 3) card.classList.add('top-3');
if (player.isMe) card.classList.add('leaderboard-me');

card.innerHTML = `
<div class="leaderboard-rank">${rank}</div>
<div class="leaderboard-avatar">${displayAvatar}</div>
<div class="leaderboard-info">
<div class="leaderboard-name">${displayName}</div>
<div class="leaderboard-score">${player.score.toLocaleString('ru-RU')} 🗳️</div>
</div>
`;
leaderboardList.appendChild(card);
});
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

// Функция для отображения заданий (заменяет заглушку)
function renderTasks() {
    const tasksContainer = document.querySelector('#screen-tasks .placeholder-content'); // Найдем контейнер внутри экрана задач
    if (!tasksContainer) return;

    // Очистим контейнер задач, если он не пуст (например, если туда была вставлена заглушка)
    tasksContainer.innerHTML = '<h2>💼 Поручения</h2>'; // Оставим заголовок

    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item'; // Добавьте класс для стилизации, если нужно
    taskDiv.innerHTML = `
        <h3>Подписаться на канал @partynewpeople</h3>
        <p>Подпишитесь на наш официальный канал и получите награду!</p>
        <p>Награда: 5000 голосов</p>
        <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted || (!taskSubscribedVisited && taskSubscribedCompleted) ? 'disabled' : ''}>
            ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке')}
        </button>
        <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
    `;
    tasksContainer.appendChild(taskDiv);

    // Здесь можно добавить другие задания аналогично в будущем
}

// Функция для обновления UI заданий (например, кнопки)
function updateTasksUI() {
    const taskButton = document.querySelector('#screen-tasks button');
    const taskLink = document.querySelector('#screen-tasks a');
    if (taskButton) {
        // Кнопка неактивна, если задание выполнено ИЛИ если ссылка не посещена, но задание не выполнено
        taskButton.disabled = taskSubscribedCompleted || (!taskSubscribedVisited && !taskSubscribedCompleted);
        if (taskSubscribedCompleted) {
            taskButton.textContent = 'Выполнено!';
        } else if (taskSubscribedVisited) {
            taskButton.textContent = 'Получить награду';
        } else {
            taskButton.textContent = 'Сначала перейдите по ссылке';
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
// Сохраняем счет в базу данных каждые 10 секунд
if (Date.now() % 10000 < 1000) {
  savePlayerScore();
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

// Инициализация пользователя Telegram и Supabase
initTelegramUser();
initSupabase();

loadGame();
updateUI();

// Сохраняем счет при загрузке игры
setTimeout(() => {
  savePlayerScore();
}, 2000);
