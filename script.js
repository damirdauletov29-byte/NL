// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0;
const energyRegenSpeed = 3;

let taskSubscribedCompleted = localStorage.getItem('task_subscribed_completed') === 'true';
let taskSubscribedVisited = localStorage.getItem('task_subscribed_visited') === 'true';

const ranks = [
    { name: "Новичок", minScore: 0, icon: "👶" },
    { name: "Активист", minScore: 500, icon: "🌱" },
    { name: "Агитатор", minScore: 2500, icon: "📢" },
    { name: "Организатор", minScore: 10000, icon: "🤝" },
    { name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
    { name: "Политик", minScore: 150000, icon: "🏛️" },
    { name: "Лидер движения", minScore: 1000000, icon: "" }
];

const upgrades = [
    { id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '', level: 0 },
    { id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
    { id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
    { id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
    { id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];

const rewards = [
    { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров', cost: 5000, icon: '🎨' },
    { id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом', cost: 25000, icon: '🧢' },
    { id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому модулю', cost: 50000, icon: '🎓' },
    { id: 'internship', name: 'Стажировка в Госдуме', desc: 'Попадание в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
    { id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством', cost: 500000, icon: '🤝' }
];

// --- СИСТЕМА СОХРАНЕНИЯ ---
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
        try {
            const parsedUpgrades = JSON.parse(savedUpgrades);
            parsedUpgrades.forEach((saved, index) => {
                if (upgrades[index]) upgrades[index].level = saved.level;
            });
        } catch(e) { console.error('Ошибка загрузки улучшений', e); }
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
}

// --- DOM ELEMENTS ---
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

// --- UI UPDATES ---
function updateUI() {
    if (!scoreEl) return;
    scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
    vphDisplay.textContent = `+${profitPerHour.toLocaleString('ru-RU')}/час`;
    
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }

    // Rank Logic
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

// --- TAP LOGIC ---
function handleTap(e) {
    e.preventDefault();
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        updateUI();
        
        // Haptic Feedback
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

// --- UPGRADES ---
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

// --- REWARDS ---
function claimReward(id) {
    const reward = rewards.find(r => r.id === id);
    if (reward && score >= reward.cost) {
        alert(`Заявка на "${reward.name}" оформлена! Свяжитесь с куратором.`);
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

// --- TASKS ---
function markLinkVisited() {
    taskSubscribedVisited = true;
    saveGame();
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
    saveGame();
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

// --- GAME LOOP ---
setInterval(() => {
    if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    if (profitPerHour > 0) score += profitPerHour / 3600;
    updateUI();
    saveGame();
}, 1000);

// --- NAVIGATION ---
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
            }
        });
    });
});

// --- INITIALIZATION ---
if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

loadGame();
updateUI();
