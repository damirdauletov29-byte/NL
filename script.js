// Начальные настройки игры (переменные)
let balance = 0;
let energy = 1000;
const maxEnergy = 1000;
const clickPower = 50; // Сколько дает за 1 клик (Политлидер района = 50 ПО)

// Находим элементы на экране, чтобы менять их через код
const balanceView = document.getElementById('balance-view');
const energyView = document.getElementById('energy-view');
const energyFill = document.getElementById('energy-fill');
const coinTrigger = document.getElementById('coin-trigger');
const clickArea = document.querySelector('.click-area');

// Функция, которая обновляет цифры на экране
function updateDisplay() {
    balanceView.textContent = Math.floor(balance);
    energyView.textContent = `${energy}/${maxEnergy}`;
    
    // Считаем процент энергии для полоски
    const percentage = (energy / maxEnergy) * 100;
    energyFill.style.width = `${percentage}%`;
}

// Что происходит при клике на кнопку
coinTrigger.addEventListener('click', (event) => {
    // Проверяем, есть ли энергия для клика
    if (energy >= 1) {
        // Уменьшаем энергию, увеличиваем баланс
        balance += clickPower;
        energy -= 1;
        
        // Обновляем текст на экране
        updateDisplay();
        
        // Создаем вылетающую цифру "+50" в месте клика
        createFloatingNumber(event.clientX, event.clientY);
    }
});

// Функция для красивой вылетающей циферки
function createFloatingNumber(x, y) {
    const num = document.createElement('div');
    num.classList.add('floating-num');
    num.textContent = `+${clickPower}`;
    
    // Ставим цифру ровно туда, куда нажал палец/мышка
    num.style.left = `${x - 20}px`;
    num.style.top = `${y - 40}px`;
    
    clickArea.appendChild(num);
    
    // Удаляем цифру из памяти через 0.6 секунд, когда закончится анимация
    setTimeout(() => {
        num.remove();
    }, 600);
}

// Таймер: каждые 1.5 секунды восстанавливаем +3 энергии
setInterval(() => {
    if (energy < maxEnergy) {
        energy = Math.min(maxEnergy, energy + 3);
        updateDisplay();
    }
}, 1500);

// Самый первый запуск: рисуем стартовые цифры
updateDisplay();
