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

// Задания с ПРАВИЛЬНЫМИ ссылками
const tasks = [
    { id: 'site', name: 'Официальный сайт', reward: 5000, icon: '🌐', link: 'https://novye.lyudi.ru/', type: 'link' },
    { id: 'tg_channel', name: 'Telegram канал', reward: 10000, icon: '✈️', link: 'https://t.me/novieludy', type: 'sub' },
    { id: 'vk_group', name: 'Группа ВКонтакте', reward: 7500, icon: '🔵', link: 'https://vk.com/novieludy', type: 'sub' },
];

// Элементы DOM
const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const rankNameEl = document.getElementById('rankName');
const rankIconEl = document.getElementById('rankIcon');
const levelFillEl = document.getElementById('levelFill');
const upgradesList = document.getElementById('upgradesList');
const tasksList = document.getElementById('tasksList');

// --- СИСТЕМА СОХРАНЕНИЯ ---
function loadGame() {
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedProfit = localStorage.getItem('nl_profit');
    const savedClickPower = localStorage.getItem('nl_clickPower');
    const savedUpgrades = localStorage.getItem('nl_upgrades');
    const completedTasks = JSON.parse(localStorage.getItem('nl_completed_tasks') || '[]');

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

    tasks.forEach(task => {
        if (completedTasks.includes(task.id)) task.completed = true;
    });
}

function saveGame() {
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_profit', profitPerHour);
    localStorage.setItem('nl_clickPower', clickPower);
    localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
    const completedIds = tasks.filter(t => t.completed).map(t => t.id);
    localStorage.setItem('nl_completed_tasks', JSON.stringify(completedIds));
}

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
    scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
    
    // Энергия
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }

    // Ранг
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
    renderTasks();
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
        if (window.navigator.vibrate) window.navigator.vibrate(10);
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
                <div class="upgrade-bonus">+${upgrade.bonus}/час</div>
            </div>
            <div class="upgrade-cost">${cost.toLocaleString('ru-RU')}</div>
        `;
        upgradesList.appendChild(card);
    });
}

// --- ЛОГИКА ЗАДАНИЙ ---
function startTask(task) {
    if (task.completed) return;
    window.open(task.link, '_blank');
    const btn = document.getElementById(`btn-${task.id}`);
    if (btn) {
        btn.textContent = 'Проверка...';
        btn.classList.add('checking');
        setTimeout(() => {
            task.completed = true;
            score += task.reward;
            saveGame();
            updateUI();
            if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
        }, 3000);
    }
}

function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = 'task-card';
        let btnText = 'Выполнить';
        let btnClass = '';
        if (task.completed) {
            btnText = 'Готово';
            btnClass = 'completed';
        }
        card.innerHTML = `
            <div class="task-info">
                <span class="task-icon">${task.icon}</span>
                <div>
                    <div class="task-name">${task.name}</div>
                    <div class="task-reward">+${task.reward} голосов</div>
                </div>
            </div>
            <button id="btn-${task.id}" class="task-btn ${btnClass}" onclick='startTask(${JSON.stringify(task)})'>${btnText}</button>
        `;
        tasksList.appendChild(card);
    });
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
            if (screen.id === targetScreenId) screen.classList.add('active');
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
