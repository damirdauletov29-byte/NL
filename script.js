// --- ИНИЦИАЛИЗАЦИЯ TELEGRAM ---
const tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем приложение на весь экран

// Получаем данные пользователя
const user = tg.initDataUnsafe?.user;
if (user) {
    const greetingEl = document.getElementById('userGreeting');
    if (greetingEl) {
        greetingEl.textContent = `Привет, ${user.first_name || 'Сторонник'}!`;
    }
}

// Настраиваем цвета под тему Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.backgroundColor || '#0d1b1e');
document.documentElement.style.setProperty('--tg-theme-text-color', tg.textColor || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#00cbd6');

// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0;
const energyRegenSpeed = 3;

// База данных улучшений
const upgrades = [
    { id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
    { id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
    { id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
    { id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
    { id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
];

// Элементы DOM
const scoreEl = document.getElementById('score');
const vphDisplay = document.getElementById('vphDisplay');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const upgradesList = document.getElementById('upgradesList');

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

// --- ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---
function updateUI() {
    scoreEl.textContent = Math.floor(score).toLocaleString('ru-RU');
    vphDisplay.textContent = `+${profitPerHour.toLocaleString('ru-RU')}/час`;
    
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${Math.floor(energy)} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }
    
    renderUpgrades();
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
        
        // Вибрация при тапе (нативная функция Telegram)
        tg.HapticFeedback.impactOccurred('light');
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
        
        // Успешная покупка
        tg.HapticFeedback.notificationOccurred('success');
    } else {
        // Недостаточно средств
        tg.HapticFeedback.notificationOccurred('error');
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

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ---
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    }
    if (profitPerHour > 0) {
        score += profitPerHour / 3600;
    }
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

// Настройка главной кнопки Telegram
tg.MainButton.setText("Вернуться в меню");
tg.MainButton.onClick(() => {
    tg.close();
});

loadGame();
updateUI();
