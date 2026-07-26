// Состояние игры
let points = 0;

// Элементы DOM
const balanceEl = document.getElementById('balance');
const clickBtn = document.getElementById('click-btn');

// Клик по кнопке
clickBtn.addEventListener('click', () => {
    points += 1;
    balanceEl.textContent = points;
});

// Навигация по вкладкам
function switchTab(tabName, buttonIndex) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Снимаем активный класс со всех кнопок навигации
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Показываем нужный экран и активируем конкретную кнопку меню по её индексу
    document.getElementById(`screen-${tabName}`).classList.add('active');
    if(navItems[buttonIndex]) {
        navItems[buttonIndex].classList.add('active');
    }
}

// Telegram WebApp интеграция
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('username').textContent = `@${tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name}`;
    }
}
