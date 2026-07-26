// Инициализация Telegram WebApp API для красивых вибраций и кастомизации
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
    tg.expand(); // Разворачиваем приложение на весь экран телефона
    tg.ready();
}

// Загрузка сохраненных данных или установка начальных значений
let balance = parseFloat(localStorage.getItem('party_balance')) || 0;
let passiveIncomePerHour = parseInt(localStorage.getItem('party_income')) || 0;
let energy = parseInt(localStorage.getItem('party_energy')) || 1000;
let totalFriends = parseInt(localStorage.getItem('party_friends')) || 0;
const maxEnergy = 1000;

// Уровни карьеры: [Минимум очков для уровня, Название статуса, Сила клика]
const levels = [
    { min: 0, name: "Уровень 1: Сторонник партии", power: 1 },
    { min: 1000, name: "Уровень 2: Волонтер штаба", power: 5 },
    { min: 10000, name: "Уровень 3: Активист молодежки", power: 10 },
    { min: 50000, name: "Уровень 4: Политлидер района", power: 50 },
    { min: 250000, name: "Уровень 5: Депутат Облдумы", power: 100 },
    { min: 1000000, name: "Уровень 6: Депутат Госдумы", power: 500 }
];

// Получаем текущую силу клика и статус на основе баланса
function getCurrentLevel() {
    let current = levels[0];
    for (let i = 0; i < levels.length; i++) {
        if (balance >= levels[i].min) {
            current = levels[i];
        }
    }
    return current;
}

// Магазин карточек прокачки (загружаем стоимость из памяти, чтобы росла цена)
let upgrades = JSON.parse(localStorage.getItem('party_upgrades_data')) || [
    { id: 'orator', name: '🗣️ Ораторские курсы', income: 10, cost: 100 },
    { id: 'vk_clip', name: '📱 Съемка клика в ВК', income: 50, cost: 500 },
    { id: 'debates', name: '🤝 Организация дебатов', income: 250, cost: 2500 },
    { id: 'iyulka', name: '🏕️ Лагерь Июлька', income: 1000, cost: 10000 },
    { id: 'office', name: '🏛️ Открытие отделения', income: 5000, cost: 50000 }
];

// Список заданий (состояние Выполнено/Нет грузим из памяти)
let tasks = JSON.parse(localStorage.getItem('party_tasks_data')) || [
    { id: 'tg_sub', name: '📢 Политическая грамотность', desc: 'Подписка на Telegram-канал партии', reward: 10000, link: 'https://t.me', done: false },
    { id: 'vk_sub', name: '👥 Молодежное крыло', desc: 'Вступить в группу молодежки ВК', reward: 12000, link: 'https://vk.com', done: false },
    { id: 'anketa', name: '📝 Кадровый резерв', desc: 'Заполнить анкету сторонника', reward: 20000, link: 'https://newpeople.ru', done: false }
];

// Элементы экрана
const balanceView = document.getElementById('balance-view');
const incomeView = document.getElementById('income-view');
const energyView = document.getElementById('energy-view');
const energyFill = document.getElementById('energy-fill');
const playerStatus = document.getElementById('player-status');
const coinTrigger = document.getElementById('coin-trigger');
const friendsCount = document.getElementById('friends-count');

// Экраны и кнопки меню
const mainScreen = document.getElementById('main-screen');
const upgradeScreen = document.getElementById('upgrade-screen');
const tasksScreen = document.getElementById('tasks-screen');
const btnMain = document.getElementById('btn-main');
const btnUpgrade = document.getElementById('btn-upgrade');
const btnTasks = document.getElementById('btn-tasks');

// Сохранение данных в localStorage
function saveGame() {
    localStorage.setItem('party_balance', balance);
    localStorage.setItem('party_income', passiveIncomePerHour);
    localStorage.setItem('party_energy', energy);
    localStorage.setItem('party_friends', totalFriends);
    localStorage.setItem('party_upgrades_data', JSON.stringify(upgrades));
    localStorage.setItem('party_tasks_data', JSON.stringify(tasks));
}

// Обновление интерфейса
function updateDisplay() {
    const currentLvl = getCurrentLevel();
    playerStatus.textContent = currentLvl.name;
    balanceView.textContent = Math.floor(balance);
    incomeView.textContent = passiveIncomePerHour;
    energyView.textContent = `${energy}/${maxEnergy}`;
    friendsCount.textContent = `Приглашено друзей: ${totalFriends}`;
    
    const percentage = (energy / maxEnergy) * 100;
    energyFill.style.width = `${percentage}%`;
}

// Переключение вкладок
function switchScreen(activeBtn, activeScreen) {
    [btnMain, btnUpgrade, btnTasks].forEach(b => b.classList.remove('active'));
    [mainScreen, upgradeScreen, tasksScreen].forEach(s => s.classList.remove('active'));
    activeBtn.classList.add('active');
    activeScreen.classList.add('active');
}

btnMain.addEventListener('click', () => switchScreen(btnMain, mainScreen));
btnUpgrade.addEventListener('click', () => { switchScreen(btnUpgrade, upgradeScreen); renderUpgrades(); });
btnTasks.addEventListener('click', () => { switchScreen(btnTasks, tasksScreen); renderTasks(); });

// Клик по главной монете
coinTrigger.addEventListener('click', (event) => {
    const currentLvl = getCurrentLevel();
    if (energy >= 1) {
        balance += currentLvl.power;
        energy -= 1;
        
        // Тактильный виброотклик на смартфонах при клике
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        
        updateDisplay();
        createFloatingNumber(event.clientX, event.clientY, currentLvl.power);
        saveGame();
    }
});

function createFloatingNumber(x, y, power) {
    const num = document.createElement('div');
    num.classList.add('floating-num');
    num.textContent = `+${power}`;
    num.style.left = `${x - 20}px`;
    num.style.top = `${y - 40}px`;
    mainScreen.appendChild(num);
    setTimeout(() => num.remove(), 600);
}

// Генерация карточек прокачки
function renderUpgrades() {
    upgradeScreen.innerHTML = '';
    upgrades.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <div class="card-info">
                <div class="card-name">${item.name}</div>
                <div class="card-profit">+${item.income} ПО/час</div>
            </div>
        `;
        const buyBtn = document.createElement('button');
        buyBtn.classList.add('card-cost');
        buyBtn.textContent = `${item.cost} ПО`;
        
        buyBtn.addEventListener('click', () => {
            if (balance >= item.cost) {
                balance -= item.cost;
                passiveIncomePerHour += item.income;
                item.cost = Math.floor(item.cost * 1.5);
                renderUpgrades();
                updateDisplay();
                saveGame();
            } else {
                if (tg) tg.showAlert('Недостаточно Политических Очков (ПО)!');
                else alert('Недостаточно Политических Очков (ПО)!');
            }
        });
        card.appendChild(buyBtn);
        upgradeScreen.appendChild(card);
    });
}

// Генерация списка заданий
function renderTasks() {
    const listContainer = document.getElementById('tasks-list');
    listContainer.innerHTML = '';
    
    tasks.forEach((task) => {
        const card = document.createElement('div');
        card.classList.add('task-card');
        card.innerHTML = `
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div style="font-size:11px; color:#aaa;">${task.desc}</div>
                <div class="task-reward">+${task.reward.toLocaleString()} ПО</div>
            </div>
        `;
        
        const btn = document.createElement('button');
        btn.classList.add('task-btn');
        
        if (task.done) {
            btn.textContent = '🍎 Выполнено';
            btn.classList.add('done');
        } else {
            btn.textContent = 'Выполнить';
            btn.addEventListener('click', () => {
                // Открываем ссылку задания в браузере
                if (tg) tg.openLink(task.link);
                else window.open(task.link, '_blank');
                
                // Симулируем проверку: через 2 секунды даем награду
                btn.textContent = 'Проверка...';
                setTimeout(() => {
                    task.done = true;
                    balance += task.reward;
                    updateDisplay();
                    renderTasks();
                    saveGame();
                    if (tg) tg.HapticFeedback.notificationOccurred('success');
                }, 2000);
            });
        }
        card.appendChild(btn);
        listContainer.appendChild(card);
    });
}

// Кнопка реферальной системы ("Приведи друга")
document.getElementById('invite-trigger').addEventListener('click', () => {
    // В реальной игре здесь формируется ссылка вида t.me/bot?start=id.
    // На чистом фронтенде мы копируем ссылку на бота и симулируем успешное приглашение для теста.
    const botLink = "https://t.me"; // Замени на ссылку твоего бота, когда захочешь
    
    navigator.clipboard.writeText(botLink).then(() => {
        if (tg) tg.showPopup({ message: "Ссылка на игру скопирована! Отправь её другу." });
        else alert("Ссылка скопирована!");
        
        // Симулируем, что друг зашел (для теста механики)
        totalFriends += 1;
        balance += 15000;
        updateDisplay();
        saveGame();
    });
});

// ТАЙМЕРЫ
// Начисление пассивного дохода раз в секунду
setInterval(() => {
    if (passiveIncomePerHour > 0) {
        balance += (passiveIncomePerHour / 3600);
        updateDisplay();
        saveGame(); // Сохраняем каждую секунду
    }
}, 1000);

// Восстановление энергии
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + 3);
        updateDisplay();
    }
}, 1500);

// Самый первый запуск интерфейса
updateDisplay();
