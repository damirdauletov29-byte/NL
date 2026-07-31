// --- КОНФИГУРАЦИЯ ИГРЫ ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
let clickPower = 1;
let profitPerHour = 0; // Голосов в час
const energyRegenSpeed = 3;

// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ ЗАДАНИЯ ПОДПИСКИ ---
let taskSubscribedCompleted = false; // Инициализируется позже
let taskSubscribedVisited = false; // Инициализируется позже

// Ранги
const ranks = [
    { name: "Новичок", minScore: 0, icon: "👶" },
    { name: "Активист", minScore: 500, icon: "🌱" },
    { name: "Агитатор", minScore: 2500, icon: "📢" },
    { name: "Организатор", minScore: 10000, icon: "🤝" },
    { name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
    { name: "Политик", minScore: 150000, icon: "🏛️" },
    { name: "Лидер движения", minScore: 1000000, icon: "狮子" }
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

// --- КОНФИГУРАЦИЯ SUPABASE ---
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL'; // ЗАМЕНИТЕ НА ВАШ URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // ЗАМЕНИТЕ НА ВАШ КЛЮЧ
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- НОВЫЕ ПЕРЕМЕННЫЕ ДЛЯ SUPABASE ---
let randomUserId = null; // Инициализируется в loadGame

// --- СИСТЕМА СОХРАНЕНИЯ ---
async function loadGame() {
    // Загрузка/генерация Random User ID
    randomUserId = localStorage.getItem('nl_random_user_id');
    if (!randomUserId) {
        randomUserId = crypto.randomUUID(); // Генерируем случайный UUID
        localStorage.setItem('nl_random_user_id', randomUserId);
    }

    // Загрузка других данных из localStorage
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedProfit = localStorage.getItem('nl_profit');
    const savedClickPower = localStorage.getItem('nl_clickPower');
    const savedUpgrades = localStorage.getItem('nl_upgrades');
    const savedTaskStatusCompleted = localStorage.getItem('task_subscribed_completed');
    const savedTaskStatusVisited = localStorage.getItem('task_subscribed_visited');

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
    if (savedTaskStatusCompleted) taskSubscribedCompleted = savedTaskStatusCompleted === 'true';
    if (savedTaskStatusVisited) taskSubscribedVisited = savedTaskStatusVisited === 'true';

    // --- НОВАЯ ЛОГИКА: Проверка/Создание пользователя в Supabase ---
    try {
        // Проверяем, есть ли пользователь с таким random_user_id в базе
        let { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('random_user_id', randomUserId)
            .single(); // single() ожидает одну строку

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 означает "Row not found"
            console.error('Supabase fetch error:', fetchError);
            alert('Ошибка подключения к серверу. Данные могут быть не синхронизированы.');
        } else if (!existingUser) {
            // Пользователь не найден, создаем новую запись
            const { error: insertError } = await supabase
                .from('users')
                .insert([{ random_user_id: randomUserId, score: score }]);

            if (insertError) {
                console.error('Supabase insert error:', insertError);
                alert('Ошибка сохранения данных. Попробуйте перезагрузить страницу.');
            } else {
                console.log('New user created in Supabase with ID:', randomUserId);
            }
        } else {
            // Пользователь найден, загружаем score из базы
            // ВАЖНО: Реализуем простое слияние - используем максимальный счет между localStorage и базой
            const serverScore = existingUser.score || 0;
            score = Math.max(score, serverScore);
            console.log('User loaded from Supabase with score:', serverScore);
        }
    } catch (err) {
         console.error('Unexpected error during Supabase operation:', err);
         alert('Произошла внутренняя ошибка. Данные могут быть не синхронизированы.');
    }
}

async function saveGame() {
     // Сохраняем в localStorage как обычно
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_profit', profitPerHour);
    localStorage.setItem('nl_clickPower', clickPower);
    localStorage.setItem('nl_upgrades', JSON.stringify(upgrades.map(u => ({ id: u.id, level: u.level }))));
    localStorage.setItem('task_subscribed_completed', taskSubscribedCompleted);
    localStorage.setItem('task_subscribed_visited', taskSubscribedVisited);

    // --- НОВАЯ ЛОГИКА: Обновление score в Supabase ---
    if (randomUserId) { // Убедимся, что ID есть
        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ score: score })
                .eq('random_user_id', randomUserId);

            if (updateError) {
                console.error('Supabase update error:', updateError);
                // alert('Ошибка синхронизации с сервером.');
            } else {
                console.log('Score updated in Supabase for user:', randomUserId);
            }
        } catch (err) {
             console.error('Unexpected error during Supabase update:', err);
             // alert('Произошла внутренняя ошибка синхронизации.');
        }
    }
}

// Элементы DOM
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

// --- ЛОГИКА ЗАДАНИЙ (TASKS) ---
function markLinkVisited() {
    taskSubscribedVisited = true;
    saveGame();
    updateTasksUI(); // Обновить состояние кнопки
    // Открываем ссылку в новой вкладке/окне
    window.open('https://t.me/partynewpeople', '_blank');
}

function completeSubscribeTask() {
    if (taskSubscribedCompleted) {
        alert("Вы уже получали награду за подписку!");
        return;
    }
    if (!taskSubscribedVisited) {
        alert("Сначала перейдите по ссылке на канал!");
        return;
    }
    // Предполагаем, что награда составляет 5000 голосов
    const reward = 5000;
    score += reward;
    taskSubscribedCompleted = true; // Отмечаем, что задание выполнено
    saveGame(); // Убедиться, что изменения сохранены
    updateUI(); // Обновить интерфейс игры (счет)
    updateTasksUI(); // Обновить интерфейс заданий (кнопку)
    alert(`Поздравляем! Вы получили ${reward} голосов за подписку на канал @partynewpeople!`);
}

// Функция для отображения заданий (заменяет заглушку)
function renderTasks() {
    const tasksContainer = document.querySelector('#screen-tasks .placeholder-content'); // Найдем контейнер внутри экрана задач
    if (!tasksContainer) return;
    // Очистим контейнер задач, если он не пуст (например, если туда была вставлена заглушка)
    tasksContainer.innerHTML = '<h2>💼 Поручения</h2>'; // Оставим заголовок
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item'; // Добавьте класс для стилизации, если нужно
    taskDiv.innerHTML = `
        <h3>Подписаться на канал @partynewpeople</h3>
        <p>Подпишитесь на наш официальный канал и получите награду!</p>
        <p>Награда: 5000 голосов</p>
        <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted || (!taskSubscribedVisited && taskSubscribedCompleted) ? 'disabled' : ''}>
            ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке')}
        </button>
        <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
    `;
    tasksContainer.appendChild(taskDiv);
    // Здесь можно добавить другие задания аналогично в будущем
}

// Функция для обновления UI заданий (например, кнопки)
function updateTasksUI() {
    const taskButton = document.querySelector('#screen-tasks button');
    const taskLink = document.querySelector('#screen-tasks a');
    if (taskButton) {
        // Кнопка неактивна, если задание выполнено ИЛИ если ссылка не посещена, но задание не выполнено
        taskButton.disabled = taskSubscribedCompleted || (!taskSubscribedVisited && !taskSubscribedCompleted);
        if (taskSubscribedCompleted) {
            taskButton.textContent = 'Выполнено!';
        } else if (taskSubscribedVisited) {
            taskButton.textContent = 'Получить награду';
        } else {
            taskButton.textContent = 'Сначала перейдите по ссылке';
        }
    }
    // Ссылка не требует обновления в данном случае, но можно добавить стили, если посещена
    if (taskLink) {
        // taskLink.style.opacity = taskSubscribedVisited ? '0.7' : '1'; // Пример стилизации
    }
}

// --- ПАССИВНЫЙ ДОХОД И РЕГЕНЕРАЦИЯ ---
setInterval(async () => { // Обернуто в async
    if (energy < maxEnergy) energy = Math.min(maxEnergy, energy + energyRegenSpeed);
    if (profitPerHour > 0) score += profitPerHour / 3600;
    updateUI();
    // Вызов saveGame() внутри setInterval может быть ресурсоемким из-за сетевых запросов.
    // Рассмотрите сохранение в Supabase менее часто (например, раз в 10-30 секунд)
    // или при определенных событиях (покупка улучшения, выход из игры).
    // await saveGame(); // Не рекомендуется вызывать так часто
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
            if (screen.id === targetScreenId) {
                screen.classList.add('active');
                // --- ДОБАВЬТЕ ЭТИ СТРОКИ ---
                if (targetScreenId === 'screen-tasks') {
                    renderTasks(); // Перерисовать задания при открытии экрана
                }
                // ---
            }
        });
    });
});

// --- ЗАПУСК ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadGame(); // Ждем завершения загрузки и синхронизации с Supabase
    updateUI();
    // Добавляем обработчики кликов
    if (slonBtn) {
        slonBtn.addEventListener('touchstart', handleTap, { passive: false });
        slonBtn.addEventListener('mousedown', handleTap);
    }
});

// --- ГЛОБАЛЬНЫЕ ФУНКЦИИ для кнопок заданий (если они вызываются из HTML) ---
// Эти функции должны быть доступны глобально
window.markLinkVisited = markLinkVisited;
window.completeSubscribeTask = completeSubscribeTask;
window.claimReward = claimReward;
