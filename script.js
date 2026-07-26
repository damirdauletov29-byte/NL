// Переменные игры
let balance = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 50; 
let passiveIncomePerHour = 0; // Изначальный доход в час

// База данных карточек (название, доход в час, начальная цена)
let upgrades = [
    { id: 'orator', name: '🗣️ Ораторские курсы', income: 10, cost: 100 },
    { id: 'vk_clip', name: '📱 Съемка клика в ВК', income: 50, cost: 500 },
    { id: 'debates', name: '🤝 Организация дебатов', income: 250, cost: 2500 },
    { id: 'iyulka', name: '🏕️ Лагерь Июлька', income: 1000, cost: 10000 },
    { id: 'office', name: '🏛️ Открытие отделения', income: 5000, cost: 50000 }
];

// Элементы интерфейса
const balanceView = document.getElementById('balance-view');
const incomeView = document.getElementById('income-view');
const energyView = document.getElementById('energy-view');
const energyFill = document.getElementById('energy-fill');
const coinTrigger = document.getElementById('coin-trigger');
const mainScreen = document.getElementById('main-screen');
const upgradeScreen = document.getElementById('upgrade-screen');

// Кнопки меню
const btnMain = document.getElementById('btn-main');
const btnUpgrade = document.getElementById('btn-upgrade');

// Функция обновления экрана
function updateDisplay() {
    balanceView.textContent = Math.floor(balance);
    incomeView.textContent = passiveIncomePerHour;
    energyView.textContent = `${energy}/${maxEnergy}`;
    const percentage = (energy / maxEnergy) * 100;
    energyFill.style.width = `${percentage}%`;
}

// Переключение экранов
btnMain.addEventListener('click', () => {
    btnMain.classList.add('active');
    btnUpgrade.classList.remove('active');
    mainScreen.classList.add('active');
    upgradeScreen.classList.remove('active');
});

btnUpgrade.addEventListener('click', () => {
    btnUpgrade.classList.add('active');
    btnMain.classList.remove('active');
    upgradeScreen.classList.add('active');
    mainScreen.classList.remove('active');
    renderUpgrades(); // Перерисовываем карточки при открытии магазина
});

// Клик по главной кнопке
coinTrigger.addEventListener('click', (event) => {
    if (energy >= 1) {
        balance += clickPower;
        energy -= 1;
        updateDisplay();
        createFloatingNumber(event.clientX, event.clientY);
    }
});

function createFloatingNumber(x, y) {
    const num = document.createElement('div');
    num.classList.add('floating-num');
    num.textContent = `+${clickPower}`;
    num.style.left = `${x - 20}px`;
    num.style.top = `${y - 40}px`;
    mainScreen.appendChild(num);
    setTimeout(() => num.remove(), 600);
}

// Функция создания карточек в магазине
function renderUpgrades() {
    upgradeScreen.innerHTML = ''; // Очищаем экран перед сборкой
    
    upgrades.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        card.innerHTML = `
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-profit">+${item.income} ПО/час</div>
            </div>
            <button class="card-cost" onclick="buyUpgrade('${item.id}')">${item.cost} ПО</button>
        `;
        upgradeScreen.appendChild(card);
    });
}

// Функция покупки карточки (Глобальная, чтобы кнопка её видела)
window.buyUpgrade = function(id) {
    const item = upgrades.find(u => u.id === id);
    
    if (balance >= item.cost) {
        balance -= item.cost; // Списываем очки
        passiveIncomePerHour += item.income; // Добавляем доход в час
        item.cost = Math.floor(item.cost * 1.5); // Увеличиваем цену следующей карточки на 50%
        
        renderUpgrades(); // Обновляем список на экране
        updateDisplay();  // Обновляем счетчики
    } else {
        alert('Недостаточно Политических Очков (ПО)!');
    }
}

// ТАЙМЕРЫ
// 1. Каждую секунду начисляем пассивный доход (доход в час делим на 3600 секунд)
setInterval(() => {
    if (passiveIncomePerHour > 0) {
        balance += (passiveIncomePerHour / 3600);
        updateDisplay();
    }
}, 1000);

// 2. Каждые 1.5 секунды восстанавливаем энергию
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + 3);
        updateDisplay();
    }
}, 1500);

// Первый запуск
updateDisplay();
