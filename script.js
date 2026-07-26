// Переменные состояния игры
let points = 0;

// Элементы DOM
const balanceEl = document.getElementById('balance');
const clickBtn = document.getElementById('click-btn');

// Обработчик клика по главной кнопке
clickBtn.addEventListener('click', () => {
    points += 1;
    balanceEl.textContent = points;
    
    // Сюда в будущем можно добавить генерацию всплывающих цифр "+1"
});

// Логика переключения вкладок меню
function switchTab(tabName) {
    // 1. Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // 2. Снимаем активный класс со всех кнопок навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 3. Активируем нужный экран и кнопку меню
    if (tabName === 'main') {
        document.getElementById('screen-main').classList.add('active');
        document.querySelectorAll('.nav-item')[0].classList.add('active');
    } else if (tabName === 'projects') {
        document.getElementById('screen-projects').classList.add('active');
        document.querySelectorAll('.nav-item')[1].classList.add('active');
    } else if (tabName === 'check-square') { // Квесты
        document.getElementById('screen-quests').classList.add('active');
        document.querySelectorAll('.nav-item')[2].classList.add('active');
    }
}

// Интеграция с Telegram WebApp (если запущено внутри Telegram)
if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Расширяем приложение на весь экран смартфона
    
    // Извлекаем реальное имя пользователя из Telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        document.getElementById('username').textContent = `@${tg.initDataUnsafe.user.username || tg.initDataUnsafe.user.first_name}`;
    }
}
