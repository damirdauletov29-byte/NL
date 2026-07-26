// --- ИГРОВАЯ БАЗА ДАННЫХ И НАСТРОЙКИ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1; 
const energyRegenSpeed = 3; 

// Список доступных карточек улучшения партии
const upgrades = [
    { id: 'hq_siberia', name: 'Штаб в Сибири 🏢', baseCost: 50, costMultiplier: 1.5, baseIncome: 1 },
    { id: 'merch_shop', name: 'Фирменный мерч 👕', baseCost: 250, costMultiplier: 1.6, baseIncome: 5 },
    { id: 'bloggers', name: 'Посты у блогеров 📢', baseCost: 1200, costMultiplier: 1.7, baseIncome: 25 },
    { id: 'law_support', name: 'Закон для ИТ-сферы 💻', baseCost: 5000, costMultiplier: 1.8, baseIncome: 120 }
];

// Объект для хранения текущих уровней улучшений (по умолчанию все 0)
let upgradeLevels = {
    hq_siberia: 0,
    merch_shop: 0,
    bloggers: 0,
    law_support: 0
};

// --- DOM ЭЛЕМЕНТЫ ---
const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const cardsContainer = document.getElementById('cardsContainer');
const passiveIncomeText = document.getElementById('passiveIncomeText');

// --- ИГРОВАЯ ЛОГИКА СОХРАНЕНИЙ И МАТЕМАТИКИ ---

// Расчет стоимости карточки на основе её текущего уровня
function getCardCost(upgrade) {
    const level = upgradeLevels[upgrade.id];
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

// Расчет общего пассивного дохода в секунду
function getTotalPassiveIncome() {
    let total = 0;
    upgrades.forEach(up => {
        total += upgradeLevels[up.id] * up.baseIncome;
    });
    return total;
}

function loadGame() {
    const savedScore = localStorage.getItem('nl_tap_score');
    const savedEnergy = localStorage.getItem('nl_tap_energy');
    const savedUpgrades = localStorage.getItem('nl_tap_upgrades');

    if (savedScore !== null) score = parseInt(savedScore, 10);
    if (savedEnergy !== null) energy = parseInt(savedEnergy, 10);
    if (savedUpgrades !== null) {
        try {
            upgradeLevels = JSON.parse(savedUpgrades);
        } catch(e) {
            console.error("Ошибка загрузки карточек", e);
        }
    }
}

function saveGame() {
    localStorage.setItem('nl_tap_score', score);
    localStorage.setItem('nl_tap_energy', energy);
    localStorage.setItem('nl_tap_upgrades', JSON.stringify(upgradeLevels));
}

// Рендеринг (отрисовка) карточек на экране «Прокачка»
function renderUpgradeCards() {
    if (!cardsContainer) return;
    cardsContainer.innerHTML = ''; // Очищаем контейнер

    upgrades.forEach(up => {
        const currentLevel = upgradeLevels[up.id];
        const cost = getCardCost(up);
        const incomeGained = up.baseIncome;

        const card = document.createElement('div');
        card.classList.add('upgrade-card');

        card.innerHTML = `
            <div class="card-info">
                <span class="card-name">${up.name}</span>
                <span class="card-level">Ур. ${currentLevel}</span>
                <span class="card-income">+${incomeGained} гол/сек от уровня</span>
            </div>
            <button class="buy-btn" id="btn-${up.id}" ${score < cost ? 'disabled' : ''}>
                🪙 ${cost.toLocaleString('ru-RU')}
            </button>
        `;

        cardsContainer.appendChild(card);

        // Вешаем событие покупки на кнопку карточки
        const buyBtn = card.querySelector(`#btn-${up.id}`);
        buyBtn.addEventListener('click', () => buyUpgrade(up.id));
    });
}

// Функция покупки улучшения
function buyUpgrade(id) {
    const upgrade = upgrades.find(up => up.id === id);
    const cost = getCardCost(upgrade);

    if (score >= cost) {
        score -= cost;
        upgradeLevels[id]++;
        
        saveGame();
        updateUI();
        renderUpgradeCards(); // Перерисовываем список с новыми ценами
    }
}

function updateUI() {
    scoreEl.textContent = score.toLocaleString('ru-RU');
    
    // Обновляем текст пассивного дохода
    if (passiveIncomeText) {
        passiveIncomeText.textContent = getTotalPassiveIncome();
    }

    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${energy} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }

    // Проверяем доступность кнопок (чтобы они блокировались или разблокировались динамически)
    upgrades.forEach(up => {
        const btn = document.getElementById(`btn-${up.id}`);
        if (btn) {
            const cost = getCardCost(up);
            btn.disabled = score < cost;
        }
    });
}

// --- СЛУШАТЕЛИ КЛИКОВ (ТАПАЛКА) ---
function handleTap(e) {
    e.preventDefault(); 
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        
        updateUI();
        saveGame();

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

if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

// --- ЕЖЕСЕКУНДНЫЕ ТАЙМЕРЫ (БАЛАНС И ЭНЕРГИЯ) ---
setInterval(() => {
    // 1. Начисление пассивного дохода
    const passiveIncome = getTotalPassiveIncome();
    if (passiveIncome > 0) {
        score += passiveIncome;
    }

    // 2. Регенерация энергии
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    }

    // Синхронизируем UI и сейвы
    updateUI();
    saveGame();
}, 1000);


// --- ЛОГИКА НАВИГАЦИИ (ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ) ---
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
                
                // Если пользователь перешел на экран прокачки — перерисовываем карточки
                if (targetScreenId === 'screen-upgrade') {
                    renderUpgradeCards();
                }
            }
        });
    });
});

// Запуск инициализации при открытии игры
loadGame();
updateUI();
