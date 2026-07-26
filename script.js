// Переменные игры
let balance = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 50; 
let passiveIncomePerHour = 0; 

// Список карточек
let upgrades = [
    { id: 'orator', name: '🗣️ Ораторские курсы', income: 10, cost: 100 },
    { id: 'vk_clip', name: '📱 Съемка клика в ВК', income: 50, cost: 500 },
    { id: 'debates', name: '🤝 Организация дебатов', income: 250, cost: 2500 },
    { id: 'iyulka', name: '🏕️ Лагерь Июлька', income: 1000, cost: 10000 },
    { id: 'office', name: '🏛️ Открытие отделения', income: 5000, cost: 50000 }
];

// Элементы экрана
const balanceView = document.getElementById('balance-view');
const incomeView = document.getElementById('income-view');
const energyView = document.getElementById('energy-view');
const energyFill = document.getElementById('energy-fill');
const coinTrigger = document.getElementById('coin-trigger');
const mainScreen = document.getElementById('main-screen');
const upgradeScreen = document.getElementById('upgrade-screen');

const btnMain = document.getElementById('btn-main');
const btnUpgrade = document.getElementById('btn-upgrade');

// Функция обновления цифр
function updateDisplay() {
    balanceView.textContent = Math.floor(balance);
    incomeView.textContent = passiveIncomePerHour;
    energyView.textContent = `${energy}/${maxEnergy}`;
    const percentage = (energy / maxEnergy) * 100;
    energyFill.style.width = `${percentage}%`;
}

// КЛИК ПО КНОПКЕ "ГЛАВНАЯ"
btnMain.addEventListener('click', () => {
    btnMain.classList.add('active');
    btnUpgrade.classList.remove('active');
    mainScreen.classList.add('active');
    upgradeScreen.classList.remove('active');
});

// КЛИК ПО КНОПКЕ "ПРОКАЧКА"
btnUpgrade.addEventListener('click', () => {
    btnUpgrade.classList.add('active');
    btnMain.classList.remove('active');
    upgradeScreen.classList.add('active');
    mainScreen.classList.remove('active');
    renderUpgrades(); // Рисуем карточки
});

// Клик по большой кнопке
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

// Рисуем карточки на экране прокачки
function renderUpgrades() {
    upgradeScreen.innerHTML = ''; 
    
    upgrades.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('card');
        
        // Название карточки и кнопка покупки
        card.innerHTML = `
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-profit">+${item.income} ПО/час</div>
            </div>
        `;

        const buyBtn = document.createElement('button');
        buyBtn.classList.add('card-cost');
        buyBtn.textContent = `${item.cost} ПО`;
        
        // Нажатие на кнопку покупки карточки
        buyBtn.addEventListener('click', () => {
            if (balance >= item.cost) {
                balance -= item.cost;
                passiveIncomePerHour += item.income;
                item.cost = Math.floor(item.cost * 1.5); // Увеличиваем цену на 50%
                renderUpgrades(); // Перерисовываем карточки с новой ценой
                updateDisplay();
            } else {
                alert('Недостаточно Политических Очков (ПО)!');
            }
        });

        card.appendChild(buyBtn);
        upgradeScreen.appendChild(card);
    });
}

// ТАЙМЕРЫ
// Начисление пассивного дохода раз в секунду
setInterval(() => {
    if (passiveIncomePerHour > 0) {
        balance += (passiveIncomePerHour / 3600);
        updateDisplay();
    }
}, 1000);

// Восстановление энергии
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + 3);
        updateDisplay();
    }
}, 1500);

// Самый первый запуск
updateDisplay();
