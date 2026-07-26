// --- ИГРОВАЯ ЛОГИКА ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1;
const energyRegenSpeed = 3;

// Награды по дням (можно менять суммы)
const dailyRewards = [500, 1000, 2500, 5000, 10000, 25000, 50000];

const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');

// Элементы модального окна
const dailyModal = document.getElementById('dailyModal');
const dayNumEl = document.getElementById('dayNum');
const rewardAmountEl = document.getElementById('rewardAmount');
const claimBtn = document.getElementById('claimBtn');

function loadGame() {
    const savedScore = localStorage.getItem('nl_tap_score');
    const savedEnergy = localStorage.getItem('nl_tap_energy');
    if (savedScore !== null) score = parseInt(savedScore, 10);
    if (savedEnergy !== null) energy = parseInt(savedEnergy, 10);
    
    checkDailyBonus(); // Проверяем бонус при загрузке
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
}

// --- ЛОГИКА ЕЖЕДНЕВНОГО БОНУСА ---
function checkDailyBonus() {
    const lastClaim = localStorage.getItem('nl_last_claim');
    const currentDay = new Date().toDateString(); // Получаем строку вида "Mon Jul 27 2026"
    
    // Если последний вход был не сегодня
    if (lastClaim !== currentDay) {
        let streak = parseInt(localStorage.getItem('nl_streak') || '0');
        
        // Если пропустили больше одного дня, сбрасываем серию на 0
        if (lastClaim) {
            const lastDate = new Date(lastClaim);
            const today = new Date();
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays > 2) streak = 0; 
        }

        // Определяем номер дня (цикл из 7 дней)
        const dayIndex = streak % dailyRewards.length;
        const reward = dailyRewards[dayIndex];

        // Показываем окно
        dayNumEl.textContent = streak + 1;
        rewardAmountEl.textContent = `+${reward}`;
        dailyModal.classList.add('active');

        // Обработка кнопки "Забрать"
        claimBtn.onclick = () => {
            score += reward;
            streak++;
            localStorage.setItem('nl_last_claim', currentDay);
            localStorage.setItem('nl_streak', streak);
            
            dailyModal.classList.remove('active');
            updateUI();
            saveGame();
            
            // Вибрация при получении награды
            if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
        };
    }
}

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

loadGame();
updateUI();
