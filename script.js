// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; // Голосов в час
const energyRegenSpeed = 3;
// Ранги
const ranks = [
{ name: "Новичок", minScore: 0, icon: "👶" },
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

// --- SUPABASE CONFIGURATION ---
// ⚠️ ВАЖНО: ЗАМЕНИТЕ НА СВОИ ДАННЫЕ ИЗ SUPABASE DASHBOARD!
const SUPABASE_URL = 'https://jagngvfawkrglnxuojtq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphZ25ndmZhd2tyZ2xueHVvanRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzM2MjksImV4cCI6MjEwMTAwOTYyOX0.V42tNuNn1NI6mGMgKRqk3M9gi33dC3IUpDe1M1ORYeM';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- TELEGRAM USER DATA ---
let telegramId = null;

// --- СИСТЕМА СОХРАНЕНИЯ (локальное хранилище как резерв) ---
function loadGame() {
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
const parsedUpgrades = JSON.parse(savedUpgrades);
parsedUpgrades.forEach((saved, index) => {
if (upgrades[index]) upgrades[index].level = saved.level;
});
}
}

function saveGame() {
localStorage.setItem('nl_score', score);
localStorage.setItem('nl_energy', energy);
localStorage.setItem('nl_profit', profitPerHour);
localStorage.setItem('nl_clickPower', clickPower);
localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
}

// --- ЗАГРУЗКА/СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ SUPABASE ---
async function loadUserFromSupabase(tgId) {
const { data, error } = await supabase
.from('users')
.select('*')
.eq('telegram_id', tgId)
.limit(1);

if (error) {
console.error('Ошибка при загрузке пользователя:', error);
return null;
}

if (data && data.length > 0) {
const user = data[0];
score = user.score || 0;
energy = user.energy || maxEnergy;
clickPower = user.click_power || 1;
profitPerHour = user.profit_per_hour || 0;
upgrades.forEach((u, i) => {
u.level = user.upgrades?.[i]?.level || 0;
});
console.log('Данные пользователя загружены из Supabase.');
return user;
}

// Новый пользователь
const newUser = {
telegram_id: tgId,
score: 0,
energy: maxEnergy,
click_power: 1,
profit_per_hour: 0,
upgrades: upgrades.map(u => ({ id: u.id, level: 0 })),
tasks_completed: []
};

const { data: inserted, error: insertError } = await supabase
.from('users')
.insert([newUser])
.select();

if (insertError) {
console.error('Ошибка при создании пользователя:', insertError);
return null;
}

console.log('Новый пользователь создан в Supabase.');
return inserted[0];
}

// --- СОХРАНЕНИЕ В SUPABASE ---
async function saveGameToSupabase(tgId) {
const updates = {
score,
energy,
click_power: clickPower,
profit_per_hour: profitPerHour,
upgrades: upgrades.map(u => ({ id: u.id, level: u.level })),
};

const { error } = await supabase
.from('users')
.update(updates)
.eq('telegram_id', tgId);

if (error) console.error('Ошибка сохранения в Supabase:', error);
}

// --- ЗАГРУЗКА РЕЙТИНГА ---
async function loadLeaderboard() {
const { data, error } = await supabase
.from('users')
.select('telegram_id, score')
.order('score', { ascending: false })
.limit(100);

if (error) {
console.error('Ошибка загрузки рейтинга:', error);
document.getElementById('leaderboardList').innerHTML = '<p>Ошибка загрузки рейтинга</p>';
return;
}

renderLeaderboard(data);
}

function renderLeaderboard(data) {
const container = document.getElementById('leaderboardList');
container.innerHTML = '';

data.forEach((user, index) => {
const card = document.createElement('div');
card.className = 'reward-card';
card.innerHTML = `
<div class="reward-header">
<span class="reward-icon">${getRankEmoji(index + 1)}</span>
<div>
<div class="reward-title">#${index + 1} ${user.telegram_id}</div>
<div class="reward-desc">${user.score.toLocaleString('ru-RU')} голосов</div>
</div>
</div>
`;
container.appendChild(card);
});
}

function getRankEmoji(position) {
switch (position) {
case 1: return "🥇";
case 2: return "🥈";
case 3: return "🥉";
default: return "👤";
}
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
// Сохраняем в Supabase при каждом тапе
if (telegramId) saveGameToSupabase(telegramId);
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
if (telegramId) saveGameToSupabase(telegramId); // Сохраняем в Supabase
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

// --- ИНИЦИАЛИЗАЦИЯ ---
async function initGame() {
// Получаем ID пользователя Telegram
const tg = window.Telegram?.WebApp;
if (!tg) {
alert("Запускайте через Telegram!");
return;
}

const user = tg.initDataUnsafe?.user;
if (!user || !user.id) {
console.error("Не удалось получить данные пользователя");
return;
}
telegramId = user.id;

// Загружаем/создаём пользователя в Supabase
await loadUserFromSupabase(telegramId);

// Загружаем локальные данные (резерв)
loadGame();

// Обновляем интерфейс
updateUI();
}

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ---
setInterval(() => {
if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
if (profitPerHour > 0) score += profitPerHour / 3600;
updateUI();
saveGame();
if (telegramId) saveGameToSupabase(telegramId); // Сохраняем в Supabase
}, 1000);

// --- НАВИГАЦИЯ ---
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

navItems.forEach(item => {
item.addEventListener('click', () => {
const targetScreenId = item.getAttribute('data-screen');
// Если открываем экран рейтинга, загружаем его
if (targetScreenId === 'screen-leaderboard') {
loadLeaderboard();
}

navItems.forEach(nav => nav.classList.remove('active'));
item.classList.add('active');

screens.forEach(screen => {
screen.classList.remove('active');
if (screen.id === targetScreenId) screen.classList.add('active');
});
});
});

// --- ЗАПУСК ---
if (slonBtn) {
slonBtn.addEventListener('touchstart', handleTap, { passive: false });
slonBtn.addEventListener('mousedown', handleTap);
}

initGame();
