// --- ИГРОВАЯ ЛОГИКА ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1;
const energyRegenSpeed = 3;

// Задания
const tasks = [
    { id: 'vk_post', name: 'Пост в ВК', desc: 'Напиши пост с хэштегом #новые люди', reward: 5000, icon: '📝', completed: false },
    { id: 'tg_subscribe', name: 'Подписка на канал', desc: 'Подпишись на наш Telegram канал', reward: 2000, icon: '📢', completed: false },
];

// Рефералы
let myReferralCode = 'user' + Math.floor(Math.random() * 1000000);
let referralsCount = 0;
let completedTasks = [];

// Данные для рейтинга (Демо)
const playersData = [
    { name: "Алексей М.", score: 15400 },
    { name: "Мария К.", score: 12300 },
    { name: "Иван П.", score: 9800 },
    { name: "Ты", score: 0, isMe: true }, // Будет обновлено
    { name: "Сергей В.", score: 4500 },
];

const regionsData = [
    { name: "Москва", score: 1540000 },
    { name: "Санкт-Петербург", score: 980000 },
    { name: "Волгоградская обл.", score: 450000, isMe: true },
    { name: "Новосибирская обл.", score: 320000 },
    { name: "Краснодарский край", score: 210000 },
];

const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const tasksList = document.getElementById('tasksList');
const leaderList = document.getElementById('leaderList');

// Загрузка
function loadGame() {
    const savedScore = localStorage.getItem('nl_score');
    const savedEnergy = localStorage.getItem('nl_energy');
    const savedTasks = localStorage.getItem('nl_completed_tasks');
    const savedReferrals = localStorage.getItem('nl_referrals');
    
    if (savedScore) score = parseInt(savedScore);
    if (savedEnergy) energy = parseInt(savedEnergy);
    if (savedTasks) completedTasks = JSON.parse(savedTasks);
    if (savedReferrals) referralsCount = parseInt(savedReferrals);
    
    // Обновляем мой счет в демо-данных
    const myPlayer = playersData.find(p => p.isMe);
    if (myPlayer) myPlayer.score = score;
}

function saveGame() {
    localStorage.setItem('nl_score', score);
    localStorage.setItem('nl_energy', energy);
    localStorage.setItem('nl_completed_tasks', JSON.stringify(completedTasks));
    localStorage.setItem('nl_referrals', referralsCount);
}

function updateUI() {
    scoreEl.textContent = score.toLocaleString('ru-RU');
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${energy} / ${maxEnergy}`;
        energyFillEl.style.width = `${(energy / maxEnergy) * 100}%`;
    }
    renderTasks();
    updateReferralStats();
    // Если открыт экран рейтинга, обновляем его
    if (document.getElementById('screen-leaderboard').classList.contains('active')) {
        renderLeaderboard(currentTab);
    }
}

// Тапы
function handleTap(e) {
    e.preventDefault();
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        updateUI();
        saveGame();
        
        let clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const pop = document.createElement('div');
        pop.className = 'tap-pop';
        pop.textContent = '+' + clickPower;
        pop.style.left = (clientX - 15) + 'px';
        pop.style.top = (clientY - 30) + 'px';
        document.querySelector('.click-area').appendChild(pop);
        setTimeout(() => pop.remove(), 600);
    }
}

// Задания
function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || completedTasks.includes(taskId)) return;
    
    // Симуляция проверки
    const btn = document.querySelector(`button[onclick="completeTask('${taskId}')"]`);
    if(btn) {
        btn.textContent = 'Проверка...';
        btn.classList.add('checking');
        setTimeout(() => {
            score += task.reward;
            completedTasks.push(taskId);
            saveGame();
            updateUI();
            alert('Задание выполнено! +' + task.reward + ' голосов');
        }, 2000);
    }
}

function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';
    tasks.forEach(task => {
        const isCompleted = completedTasks.includes(task.id);
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div class="task-header">
                <span class="task-name">${task.icon} ${task.name}</span>
                <span class="task-reward">+${task.reward}</span>
            </div>
            <div class="task-desc">${task.desc}</div>
            <button class="task-btn ${isCompleted ? 'completed' : ''}" 
                    onclick="completeTask('${task.id}')">
                ${isCompleted ? '✓ Выполнено' : 'Выполнить'}
            </button>
        `;
        tasksList.appendChild(card);
    });
}

// Рефералы
function copyReferralLink() {
    const link = `https://t.me/NewPeopleGameBot?start=ref_${myReferralCode}`;
    navigator.clipboard.writeText(link).then(() => alert('Ссылка скопирована!'));
}

function updateReferralStats() {
    const linkEl = document.getElementById('referralLink');
    const countEl = document.getElementById('referralCount');
    const bonusEl = document.getElementById('referralBonus');
    if (linkEl) linkEl.textContent = `t.me/NewPeopleGameBot?start=ref_${myReferralCode}`;
    if (countEl) countEl.textContent = referralsCount;
    if (bonusEl) bonusEl.textContent = (referralsCount * 1000).toLocaleString();
}

// РЕЙТИНГ
let currentTab = 'players';

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderLeaderboard(tab);
}

function renderLeaderboard(type) {
    if (!leaderList) return;
    leaderList.innerHTML = '';
    
    const data = type === 'players' ? [...playersData] : [...regionsData];
    // Сортируем по очкам
    data.sort((a, b) => b.score - a.score);
    
    data.forEach((item, index) => {
        const isMe = item.isMe;
        const card = document.createElement('div');
        card.className = `leader-card ${isMe ? 'my-rank' : ''}`;
        
        let rankIcon = index + 1;
        if (index === 0) rankIcon = '🥇';
        if (index === 1) rankIcon = '🥈';
        if (index === 2) rankIcon = '🥉';

        card.innerHTML = `
            <div class="leader-rank">${rankIcon}</div>
            <div class="leader-info">
                <div class="leader-name">${item.name} ${isMe ? '(Вы)' : ''}</div>
                <div class="leader-score">${item.score.toLocaleString()} голосов</div>
            </div>
        `;
        leaderList.appendChild(card);
    });
}

// Навигация
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const screenId = item.getAttribute('data-screen');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Если перешли на рейтинг, рендерим его
        if (screenId === 'screen-leaderboard') {
            renderLeaderboard(currentTab);
        }
    });
});

// Запуск
if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
        updateUI();
        saveGame();
    }
}, 1000);

loadGame();
updateUI();
