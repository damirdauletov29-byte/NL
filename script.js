// --- ИГРОВАЯ ЛОГИКА ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1;
const energyRegenSpeed = 3;

// Данные для Лиги Регионов (Демо-данные)
const regions = [
    { id: 'msk', name: 'Москва', score: 1540000 },
    { id: 'spb', name: 'Санкт-Петербург', score: 980000 },
    { id: 'nsk', name: 'Новосибирская обл.', score: 450000 },
    { id: 'ekb', name: 'Свердловская обл.', score: 320000 },
    { id: 'kzn', name: 'Республика Татарстан', score: 210000 },
];

// Для демо считаем, что игрок из Новосибирска
const myRegionId = 'nsk'; 

const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');
const leaderboardList = document.getElementById('leaderboardList');

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
    renderLeaderboard();
}

// Обработка тапа
function handleTap(e) {
    e.preventDefault();
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        
        // В реальной игре здесь был бы запрос к API для обновления счета региона
        // Для демо просто увеличиваем счет нашего региона локально
        const myRegion = regions.find(r => r.id === myRegionId);
        if (myRegion) myRegion.score += clickPower;

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

// Логика Лиги Регионов
function renderLeaderboard() {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    
    // Сортируем регионы по очкам
    const sortedRegions = [...regions].sort((a, b) => b.score - a.score);
    
    sortedRegions.forEach((region, index) => {
        const isMyRegion = region.id === myRegionId;
        const card = document.createElement('div');
        card.className = `region-card ${isMyRegion ? 'my-region' : ''}`;
        
        let rankIcon = index + 1;
        if (index === 0) rankIcon = '🥇';
        if (index === 1) rankIcon = '🥈';
        if (index === 2) rankIcon = '🥉';

        card.innerHTML = `
            <div class="region-rank">${rankIcon}</div>
            <div class="region-info">
                <div class="region-name">${region.name} ${isMyRegion ? '(Вы)' : ''}</div>
                <div class="region-score">${region.score.toLocaleString()} голосов</div>
            </div>
            ${index < 3 ? '<span class="region-badge">TOP</span>' : ''}
        `;
        leaderboardList.appendChild(card);
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
