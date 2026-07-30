// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0;
const energyRegenSpeed = 3;
let completedTasks = [];
let pendingTasks = [];

// ⚠️ ЗАМЕНИТЕ на реальный юзернейм вашего бота (без @)
const BOT_USERNAME = "newpeople_support_bot"; 

const ranks = [
{ name: "Новичок", minScore: 0, icon: "👶" },
{ name: "Активист", minScore: 500, icon: "🌱" },
{ name: "Агитатор", minScore: 2500, icon: "📢" },
{ name: "Организатор", minScore: 10000, icon: "🤝" },
{ name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
{ name: "Политик", minScore: 150000, icon: "🏛️" },
{ name: "Лидер движения", minScore: 1000000, icon: "🦁" }
];

const upgrades = [
{ id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
{ id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
{ id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
{ id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
{ id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];

const tasks = [
{ 
    id: 'tg_sub', 
    name: 'Подписка на Telegram', 
    desc: 'Подпишись на официальный канал партии "Новые люди"', 
    link: 'https://t.me/partynewpeople', 
    reward: 5000, 
    icon: '✈️',
    type: 'check'
},
{ 
    id: 'vk_post', 
    name: 'Пост в ВКонтакте', 
    desc: 'Выложи пост с хэштегом #новыелюди и отправь ссылку нашему боту', 
    link: `https://t.me/${BOT_USERNAME}`, 
    reward: 10000, 
    icon: '🔵',
    type: 'bot'
}
];

const rewards = [
{ id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
{ id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '🧢' },
{ id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
{ id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
{ id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
];

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
const tasksList = document.getElementById('tasksList');
const rewardsList = document.getElementById('rewardsList');

function loadGame() {
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedProfit = localStorage.getItem('nl_profit');
    const savedClickPower = localStorage.getItem('nl_clickPower');
    const savedUpgrades = localStorage.getItem('nl_upgrades');
    const savedCompleted = localStorage.getItem('nl_completedTasks');
    const savedPending = localStorage.getItem('nl_pendingTasks');
    
    if (savedScore) score = parseInt(savedScore);
    if (savedEnergy) energy = parseInt(savedEnergy);
    if (savedProfit) profitPerHour = parseInt(savedProfit);
    if (savedClickPower) clickPower = parseInt(savedClickPower);
    if (savedUpgrades) {
        const parsed = JSON.parse(savedUpgrades);
        parsed.forEach((saved, index) => { if (upgrades[index]) upgrades[index].level = saved.level; });
    }
    if (savedCompleted) completedTasks = JSON.parse(savedCompleted);
    if (savedPending) pendingTasks = JSON.parse(savedPending);
}

function saveGame() {
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_profit', profitPerHour);
    localStorage.setItem('nl_clickPower', clickPower);
    localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
    localStorage.setItem('nl_completedTasks', JSON.stringify(completedTasks));
    localStorage.setItem('nl_pendingTasks', JSON.stringify(pendingTasks));
}

function updateUI() {
    scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
    vphDisplay.textContent = `+${profitPerHour.toLocaleString('ru-RU')}/час`;
    
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
        energyFillEl.style.width = `${(energy / maxEnergy) * 100}%`;
    }
    
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
    renderRewards();
}

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

function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const isCompleted = completedTasks.includes(task.id);
        const isPending = pendingTasks.includes(task.id);
        
        let btnText = 'Перейти';
        let btnClass = '';
        let isDisabled = false;

        if (isCompleted) {
            btnText = 'Выполнено ✅';
            btnClass = 'completed';
            isDisabled = true;
        } else if (isPending) {
            btnText = 'На проверке ⏳';
            btnClass = 'checking';
            isDisabled = true;
        } else if (task.type === 'bot') {
            btnText = 'Отправить ссылку';
        }

        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div class="task-icon">${task.icon}</div>
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-desc">${task.desc}</div>
                </div>
            </div>
            <div class="task-footer">
                <span class="task-reward">+${task.reward.toLocaleString('ru-RU')} 🗳️</span>
                <button class="task-btn ${btnClass}" ${isDisabled ? 'disabled' : ''} onclick="handleTaskClick('${task.id}')">
                    ${btnText}
                </button>
            </div>
        `;
        tasksList.appendChild(card);
    });
}

function handleTaskClick(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || completedTasks.includes(taskId) || pendingTasks.includes(taskId)) return;

    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(task.link);
    } else {
        window.open(task.link, '_blank');
    }

    if (task.type === 'bot') {
        // Для задания с ботом сразу ставим статус "На проверке"
        pendingTasks.push(taskId);
        saveGame();
        updateUI();
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert("📩 Отправьте ссылку на ваш пост в открывшемся чате с ботом. После проверки модератором очки будут начислены!");
        }
    } else {
        // Для подписки на канал имитируем проверку (в будущем здесь будет реальный API запрос)
        const btn = event.target;
        btn.textContent = 'Проверка...';
        btn.disabled = true;
        setTimeout(() => {
            score += task.reward;
            completedTasks.push(taskId);
            saveGame();
            updateUI();
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showAlert(`🎉 Задание выполнено!\nНачислено +${task.reward.toLocaleString('ru-RU')} голосов!`);
            }
        }, 2000);
    }
}

function claimReward(id) {
    const reward = rewards.find(r => r.id === id);
    if (reward && score >= reward.cost) {
        score -= reward.cost;
        saveGame();
        updateUI();
        alert(`🎉 Поздравляем! Вы оформили заявку на "${reward.name}".\nСвяжитесь с куратором в Telegram для получения.`);
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
                <span class="reward-cost">${reward.cost.toLocaleString('ru-RU')} 🗳️</span>
                <button class="claim-reward-btn" ${canClaim ? '' : 'disabled'} onclick="claimReward('${reward.id}')">
                    ${canClaim ? 'Получить' : 'Недоступно'}
                </button>
            </div>
        `;
        rewardsList.appendChild(card);
    });
}

setInterval(() => {
    if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    if (profitPerHour > 0) score += profitPerHour / 3600;
    updateUI();
    saveGame();
}, 1000);

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

if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

loadGame();
updateUI();
