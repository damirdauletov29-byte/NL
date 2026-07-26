// --- ИГРОВАЯ ЛОГИКА (ТАПАЛКА, ЭНЕРГИЯ И СОХРАНЕНИЕ) ---
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1; 
const energyRegenSpeed = 3; 

const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');

// Загрузка сохраненного прогресса из памяти браузера (LocalStorage)
function loadGame() {
    const savedScore = localStorage.getItem('nl_tap_score');
    const savedEnergy = localStorage.getItem('nl_tap_energy');

    if (savedScore !== null) score = parseInt(savedScore, 10);
    if (savedEnergy !== null) energy = parseInt(savedEnergy, 10);
}

// Запись текущего прогресса в LocalStorage
function saveGame() {
    localStorage.setItem('nl_tap_score', score);
    localStorage.setItem('nl_tap_energy', energy);
}

// Обновление элементов интерфейса на основе актуальных данных
function updateUI() {
    scoreEl.textContent = score.toLocaleString('ru-RU');
    if (energyTextEl && energyFillEl) {
        energyTextEl.textContent = `${energy} / ${maxEnergy}`;
        const percentage = (energy / maxEnergy) * 100;
        energyFillEl.style.width = `${percentage}%`;
    }
}

// Функция обработки нажатия на кнопку-слона
function handleTap(e) {
    e.preventDefault(); // Защита от системного двойного тапа и масштабирования
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        
        updateUI();
        saveGame(); // Сохраняем состояние сразу после изменения баланса

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

// Создание анимированной вылетающей цифры (+1)
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

// Привязка событий клика и тача к главной кнопке
if (slonBtn) {
    slonBtn.addEventListener('touchstart', handleTap, { passive: false });
    slonBtn.addEventListener('mousedown', handleTap);
}

// Таймер регенерации энергии (срабатывает раз в секунду)
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
        updateUI();
        saveGame(); // Периодически фиксируем восстановленную энергию
    }
}, 1000);


// --- ЛОГИКА НАВИГАЦИИ (ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ) ---
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Снимаем активный статус со всех пунктов меню
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const targetScreenId = item.getAttribute('data-screen');

        // Скрываем все разделы и отображаем выбранный пользователем
        screens.forEach(screen => {
            screen.classList.remove('active');
            if (screen.id === targetScreenId) {
                screen.classList.add('active');
            }
        });
    });
});

// Запуск инициализации при открытии игры
loadGame();
updateUI();
