// Инициализация игровых переменных
let score = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 1; // Сколько давать за один тап
const energyRegenSpeed = 3; // Сколько энергии восстанавливать в секунду

// Получение элементов DOM
const scoreEl = document.getElementById('score');
const energyTextEl = document.getElementById('energyText');
const energyFillEl = document.getElementById('energyFill');
const clickArea = document.getElementById('clickArea');
const slonBtn = document.getElementById('slonBtn');

// Функция обновления интерфейса
function updateUI() {
    scoreEl.textContent = score.toLocaleString('ru-RU');
    energyTextEl.textContent = `${energy} / ${maxEnergy}`;
    
    const percentage = (energy / maxEnergy) * 100;
    energyFillEl.style.width = `${percentage}%`;
}

// Обработчик события клика/тапа
function handleTap(e) {
    e.preventDefault(); // Предотвращаем зум на смартфонах

    // Проверяем, хватает ли энергии для клика
    if (energy >= clickPower) {
        score += clickPower;
        energy -= clickPower;
        updateUI();

        // Получаем координаты клика (поддержка мыши и тач-скрина)
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

// Создание всплывающего текста "+1"
function createPopUp(x, y) {
    const pop = document.createElement('div');
    pop.classList.add('tap-pop');
    pop.textContent = `+${clickPower}`;

    // Позиционируем элемент относительно области клика
    const rect = clickArea.getBoundingClientRect();
    pop.style.left = `${x - rect.left - 15}px`;
    pop.style.top = `${y - rect.top - 30}px`;

    clickArea.appendChild(pop);

    // Удаляем элемент после завершения анимации
    setTimeout(() => {
        pop.remove();
    }, 600);
}

// Слушатели событий (для смартфонов используем touchstart, для ПК — mousedown)
slonBtn.addEventListener('touchstart', handleTap, { passive: false });
slonBtn.addEventListener('mousedown', handleTap);

// Регенерация энергии каждую секунду
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + energyRegenSpeed);
        updateUI();
    }
}, 1000);

// Первоначальный запуск
updateUI();
