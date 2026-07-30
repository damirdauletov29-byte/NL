// --- ИМПОРТ SUPABASE ---
import { supabase, getTelegramUserId } from './supabase.js';

// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0;
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
    { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров', cost: 5000, icon: '🎨' },
];

// --- ЗАГРУЗКА ДАННЫХ ИЗ SUPABASE ---
async function loadGameFromSupabase() {
    const userId = getTelegramUserId();
    if (!userId) {
        console.error('Не удалось получить telegram_id');
        return;
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', userId)
        .limit(1);

    if (error) {
        console.warn('Пользователь не найден, создаем нового');
        await createNewUser(userId);
        return loadGameFromSupabase(); // Повторная загрузка
    }

    if (data && data.length > 0) {
        const user = data[0];
        score = user.score || 0;
        energy = user.energy || 1000;
        clickPower = user.click_power || 1;
        profitPerHour = user.profit_per_hour || 0;
        
        // Восстанавливаем улучшения
        const upgradesData = user.upgrades || {};
        upgrades.forEach(u => u.level = upgradesData[u.id] || 0);
        
        // Восстанавливаем задания
        const tasksData = user.tasks_completed || {};
        // Здесь можно добавить логику для задач
    }
}

async function createNewUser(userId) {
    const { error } = await supabase
        .from('users')
        .insert({
            telegram_id: userId,
            score: 0,
            energy: 1000,
            click_power: 1,
            profit_per_hour: 0,
            upgrades: {},
            tasks_completed: {}
        });
    if (error) console.error('Ошибка создания пользователя:', error);
}

// --- СОХРАНЕНИЕ В SUPABASE ---
async function saveGameToSupabase() {
    const userId = getTelegramUserId();
    if (!userId) return;

    const upgradesObj = {};
    upgrades.forEach(u => upgradesObj[u.id] = u.level);

    const { error } = await supabase
        .from('users')
        .upsert({
            telegram_id: userId,
            score,
            energy,
            click_power: clickPower,
            profit_per_hour: profitPerHour,
            upgrades: upgradesObj,
            tasks_completed: {} // Можно расширить
        }, {
            onConflict: 'telegram_id'
        });

    if (error) console.error('Ошибка сохранения:', error);
}

// --- ОСТАЛЬНАЯ ЛОГИКА (остается как в вашем файле) ---
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
        saveGameToSupabase(); // Сохраняем сразу
        
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

// --- УЛУЧШЕНИЯ ---
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
        updateUI();
        saveGameToSupabase();
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

// --- БИРЖА ---
function claimReward(id) {
    const reward = rewards.find(r => r.id === id);
    if (reward && score >= reward.cost) {
        alert(`Поздравляем! Вы оформили заявку на "${reward.name}".`);
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

// --- ПАССИВНЫЙ ДОХОД ---
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
        updateUI();
        saveGameToSupabase();
    }
    if (profitPerHour > 0) {
        score += profitPerHour / 3600;
        updateUI();
        saveGameToSupabase();
    }
}, 1000);

// --- НАВИГАЦИЯ ---
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const screenId = item.getAttribute('data-screen');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    });
});

// --- ЗАПУСК ---
if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

// Загрузка игры
(async () => {
    await loadGameFromSupabase();
    updateUI();
})();
