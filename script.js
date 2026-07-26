// --- ИГРОВАЯ ЛОГИКА ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1;
const energyRegenSpeed = 3;

// Реальные награды (Биржа Лидеров)
const rewards = [
    { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
    { id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '🧢' },
    { id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
    { id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
    { id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
];

const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const rewardsList = document.getElementById('rewardsList');

// Загрузка сохранений
function loadGame() {
    const savedScore = localStorage.getItem('nl_tap_score');
    const savedEnergy = localStorage.getItem('nl_tap_energy');
    if (savedScore !== null) score = parseInt(savedScore, 10);
    if (savedEnergy !== null) energy = parseInt(savedEnergy, 10);
}

function saveGame() {
    localStorage.setItem('nl_tap_score', score);
    localStorage.setItem('nl_tap_energy', energy);
}

function updateUI() {
    scoreEl.textContent = score.toLocaleString('ru-RU');
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${energy} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }
    renderRewards(); // Обновляем биржу при изменении счета
}

// Обработка тапа
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

// Логика Биржи Лидеров
function claimReward(id) {
    const reward = rewards.find(r => r.id === id);
    if (reward && score >= reward.cost) {
        // В реальной игре здесь был бы запрос к API
        alert(`Поздравляем! Вы оформили заявку на "${reward.name}". Свяжитесь с куратором для получения.`);
        // Можно добавить списание очков, если нужно: score -= reward.cost;
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

// Таймер энергии
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
        updateUI();
        saveGame();
    }
}, 1000);

// Навигация
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

loadGame();
updateUI();
