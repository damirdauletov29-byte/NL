// Добавьте в начало файла (после других переменных)
const API_URL = "https://ВАШ_СЕРВЕР.com/check_promo"; // Замените на адрес вашего сервера

// Замените функцию renderTasks() на эту:
function renderTasks() {
    if (!tasksList) return;
    tasksList.innerHTML = '';
    
    // Блок ввода промокода
    const promoBlock = document.createElement('div');
    promoBlock.className = 'task-card';
    promoBlock.style.flexDirection = 'column';
    promoBlock.style.alignItems = 'stretch';
    promoBlock.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:10px;">
            <div class="task-icon">🎟️</div>
            <div class="task-info">
                <div class="task-name">Ввести промокод</div>
                <div class="task-desc">Получили код от бота? Активируйте его здесь!</div>
            </div>
        </div>
        <div style="display:flex; gap:8px;">
            <input type="text" id="promoInput" placeholder="NL-XXXXXX" 
                   style="flex:1; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(0,203,214,0.3); border-radius:8px; color:#fff; font-size:14px; text-transform:uppercase; letter-spacing:2px; outline:none;">
            <button class="task-btn" onclick="checkPromo()" style="min-width:100px;">Активировать</button>
        </div>
        <div id="promoMessage" style="margin-top:8px; font-size:12px; min-height:16px;"></div>
    `;
    tasksList.appendChild(promoBlock);
    
    // Обычные задания
    tasks.forEach(task => {
        const isCompleted = completedTasks.includes(task.id);
        const isPending = pendingTasks.includes(task.id);
        
        let btnText = 'Перейти';
        let btnClass = '';
        let isDisabled = false;

        if (isCompleted) {
            btnText = 'Выполнено ✅';
            btnClass = 'completed';
            isDisabled = true;
        } else if (isPending) {
            btnText = 'На проверке ⏳';
            btnClass = 'checking';
            isDisabled = true;
        } else if (task.type === 'bot') {
            btnText = 'Отправить ссылку';
        }

        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div class="task-icon">${task.icon}</div>
                <div class="task-info">
                    <div class="task-name">${task.name}</div>
                    <div class="task-desc">${task.desc}</div>
                </div>
            </div>
            <div class="task-footer">
                <span class="task-reward">+${task.reward.toLocaleString('ru-RU')} 🗳️</span>
                <button class="task-btn ${btnClass}" ${isDisabled ? 'disabled' : ''} onclick="handleTaskClick('${task.id}')">
                    ${btnText}
                </button>
            </div>
        `;
        tasksList.appendChild(card);
    });
}

// НОВАЯ ФУНКЦИЯ: проверка промокода через API бота
async function checkPromo() {
    const input = document.getElementById('promoInput');
    const messageEl = document.getElementById('promoMessage');
    const promo = input.value.trim().toUpperCase();
    
    if (!promo) {
        messageEl.style.color = '#ff6b6b';
        messageEl.textContent = '⚠️ Введите промокод';
        return;
    }
    
    messageEl.style.color = '#ffa500';
    messageEl.textContent = '⏳ Проверяем промокод...';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ promo: promo })
        });
        
        const result = await response.json();
        
        if (result.success) {
            score += result.amount;
            saveGame();
            updateUI();
            messageEl.style.color = '#00ffcc';
            messageEl.textContent = `🎉 Успех! +${result.amount.toLocaleString('ru-RU')} голосов!`;
            input.value = '';
            if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showPopup({
                    title: '🎉 Промокод активирован!',
                    message: `Вам начислено ${result.amount.toLocaleString('ru-RU')} голосов!`,
                    buttons: [{type: 'ok'}]
                });
            }
        } else {
            messageEl.style.color = '#ff6b6b';
            messageEl.textContent = '❌ ' + (result.error || 'Неверный промокод');
        }
    } catch (error) {
        messageEl.style.color = '#ff6b6b';
        messageEl.textContent = '⚠️ Ошибка соединения с сервером';
        console.error(error);
    }
}
