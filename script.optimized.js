// ============================================
// ОПТИМИЗИРОВАННАЯ ВЕРСИЯ ДЛЯ SUPABASE FREE TIER
// ============================================
// Цели оптимизации:
// 1. Минимизация запросов к БД (главный лимит Free: 50K запросов/месяц)
// 2. Батчинг операций записи
// 3. Кэширование читаемых данных
// 4. Защита от читерства
// 5. Эффективная схема БД

// ============================================
// 1. КОНФИГУРАЦИЯ И КОНСТАНТЫ
// ============================================
const CONFIG = {
    SUPABASE_URL: 'https://fncfdimmmlqwjbsslntk.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuY2ZkaW1tbWxxd2pic3NsbnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MzIzOTEsImV4cCI6MjEwMTEwODM5MX0.HoSvbTqGio8mSWCYf17o4c1FQd9C-Na8TGwWo_GmBTI',
    
    // Интервалы синхронизации (в миллисекундах)
    SYNC_INTERVAL_NORMAL: 30000,      // 30 сек - обычная синхронизация
    SYNC_INTERVAL_ACTIVE: 10000,      // 10 сек - при активных действиях
    LEADERBOARD_CACHE_TTL: 60000,     // 1 мин - кэш рейтинга
    
    // Лимиты для защиты от читерства
    MAX_CLICKS_PER_SECOND: 10,        // Максимум кликов в секунду
    MAX_SCORE_DELTA_PER_SYNC: 50000,  // Максимальное изменение счета за синхронизацию
    MIN_ENERGY_REGEN_TIME: 1000,      // Минимальное время регенерации энергии
    
    // Пороги для активной синхронизации
    ACTIVE_SYNC_THRESHOLD: 100000,    // При счете > 100K включаем частую синхронизацию
};

// ============================================
// 2. МЕНЕДЖЕР СОСТОЯНИЯ (STATE MANAGER)
// ============================================
class GameStateManager {
    constructor() {
        this.state = {
            score: 0,
            energy: 1000,
            maxEnergy: 1000,
            clickPower: 1,
            profitPerHour: 0,
            upgrades: [],
            lastSyncTime: Date.now(),
            lastLeaderboardLoad: 0,
            pendingScoreDelta: 0,     // Накопленные изменения для отправки
            pendingEnergyDelta: 0,
            clickHistory: [],         // История кликов для античита
            isDirty: false,           // Есть ли несохраненные изменения
            syncInterval: CONFIG.SYNC_INTERVAL_NORMAL,
        };
        
        this.localCache = {
            leaderboard: null,
            leaderboardExpiry: 0,
            userData: null,
        };
        
        this.energyRegenSpeed = 3;
        this.ranks = [
            { name: "Новичок", minScore: 0, icon: "👶" },
            { name: "Активист", minScore: 500, icon: "🌱" },
            { name: "Агитатор", minScore: 2500, icon: "📢" },
            { name: "Организатор", minScore: 10000, icon: "🤝" },
            { name: "Лидер ячейки", minScore: 50000, icon: "⭐" },
            { name: "Политик", minScore: 150000, icon: "🏛️" },
            { name: "Лидер движения", minScore: 1000000, icon: "👑" }
        ];
    }
    
    // Загрузка из localStorage
    loadFromLocal() {
        const saved = {
            score: localStorage.getItem('nl_score'),
            energy: localStorage.getItem('nl_energy'),
            profit: localStorage.getItem('nl_profit'),
            clickPower: localStorage.getItem('nl_clickPower'),
            upgrades: localStorage.getItem('nl_upgrades'),
            lastLogin: localStorage.getItem('nl_lastLoginTime'),
        };
        
        if (saved.score) this.state.score = parseInt(saved.score);
        if (saved.energy) this.state.energy = parseInt(saved.energy);
        if (saved.profit) this.state.profitPerHour = parseInt(saved.profit);
        if (saved.clickPower) this.state.clickPower = parseInt(saved.clickPower);
        if (saved.upgrades) {
            this.state.upgrades = JSON.parse(saved.upgrades);
        }
        
        // Оффлайн-доход и регенерация энергии
        if (saved.lastLogin) {
            const timeAway = Date.now() - parseInt(saved.lastLogin);
            const secondsAway = Math.floor(timeAway / 1000);
            
            // Регенерация энергии
            const regeneratedEnergy = secondsAway * this.energyRegenSpeed;
            this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + regeneratedEnergy);
            
            // Оффлайн-доход
            if (this.state.profitPerHour > 0) {
                const hoursAway = timeAway / (1000 * 60 * 60);
                const offlineEarnings = Math.floor(this.state.profitPerHour * hoursAway);
                this.state.score += offlineEarnings;
            }
        }
        
        this.state.lastSyncTime = Date.now();
        this.saveToLocal();
    }
    
    // Сохранение в localStorage (быстрое, без БД)
    saveToLocal() {
        localStorage.setItem('nl_score', this.state.score);
        localStorage.setItem('nl_energy', this.state.energy);
        localStorage.setItem('nl_profit', this.state.profitPerHour);
        localStorage.setItem('nl_clickPower', this.state.clickPower);
        localStorage.setItem('nl_upgrades', JSON.stringify(this.state.upgrades));
        localStorage.setItem('nl_lastLoginTime', Date.now());
    }
    
    // Обработка клика с античитом
    handleTap(clickPower) {
        const now = Date.now();
        
        // Античит: проверяем частоту кликов
        this.state.clickHistory.push(now);
        this.state.clickHistory = this.state.clickHistory.filter(
            t => now - t < 1000  // Храним только клики за последнюю секунду
        );
        
        if (this.state.clickHistory.length > CONFIG.MAX_CLICKS_PER_SECOND) {
            console.warn('Превышен лимит кликов в секунду!');
            return false; // Блокируем слишком частые клики
        }
        
        if (this.state.energy >= clickPower) {
            this.state.score += clickPower;
            this.state.energy -= clickPower;
            this.state.pendingScoreDelta += clickPower;
            this.state.pendingEnergyDelta -= clickPower;
            this.state.isDirty = true;
            
            // Динамическая настройка интервала синхронизации
            if (this.state.score > CONFIG.ACTIVE_SYNC_THRESHOLD) {
                this.state.syncInterval = CONFIG.SYNC_INTERVAL_ACTIVE;
            }
            
            return true;
        }
        return false;
    }
    
    // Покупка улучшения
    buyUpgrade(upgradeIndex, upgradesData) {
        const upgrade = upgradesData[upgradeIndex];
        const cost = this.getUpgradeCost(upgrade);
        
        if (this.state.score >= cost) {
            this.state.score -= cost;
            upgrade.level++;
            this.state.profitPerHour += upgrade.bonus;
            this.state.clickPower += 1;
            this.state.isDirty = true;
            this.saveToLocal();
            return true;
        }
        return false;
    }
    
    getUpgradeCost(upgrade) {
        return Math.floor(upgrade.baseCost * Math.pow(1.15, upgrade.level));
    }
    
    // Получение накопленных изменений для синхронизации
    getPendingChanges() {
        return {
            scoreDelta: this.state.pendingScoreDelta,
            energyDelta: this.state.pendingEnergyDelta,
            timestamp: Date.now()
        };
    }
    
    // Сброс накопленных изменений после успешной синхронизации
    resetPendingChanges() {
        this.state.pendingScoreDelta = 0;
        this.state.pendingEnergyDelta = 0;
        this.state.isDirty = false;
        this.state.lastSyncTime = Date.now();
    }
    
    // Регенерация энергии и пассивный доход
    tick() {
        if (this.state.energy < this.state.maxEnergy) {
            this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + this.energyRegenSpeed);
        }
        if (this.state.profitPerHour > 0) {
            this.state.score += this.state.profitPerHour / 3600;
        }
    }
    
    // Получение текущего ранга
    getCurrentRank() {
        let currentRankIndex = 0;
        for (let i = 0; i < this.ranks.length; i++) {
            if (this.state.score >= this.ranks[i].minScore) {
                currentRankIndex = i;
            } else {
                break;
            }
        }
        return this.ranks[currentRankIndex];
    }
    
    // Прогресс до следующего ранга
    getRankProgress() {
        const currentRank = this.getCurrentRank();
        const currentIndex = this.ranks.indexOf(currentRank);
        const nextRank = this.ranks[currentIndex + 1];
        
        if (!nextRank) return 100;
        
        const progress = ((this.state.score - currentRank.minScore) / 
                         (nextRank.minScore - currentRank.minScore)) * 100;
        return Math.min(100, Math.max(0, progress));
    }
}

// ============================================
// 3. МЕНЕДЖЕР БАЗЫ ДАННЫХ (OPTIMIZED DB MANAGER)
// ============================================
class DatabaseManager {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.requestQueue = [];
        this.isProcessing = false;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    // Батчинг запросов - группировка нескольких операций
    async batchUpsertPlayer(playerData) {
        this.requestQueue.push({
            type: 'upsert',
            data: playerData,
            timestamp: Date.now()
        });
        
        // Обрабатываем очередь пакетами
        if (!this.isProcessing && this.requestQueue.length > 0) {
            await this.processQueue();
        }
    }
    
    // Обработка очереди запросов
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        
        try {
            // Берем последние данные игрока (предыдущие перезаписываются)
            const latestPlayerData = this.requestQueue[this.requestQueue.length - 1].data;
            
            // Группируем запросы по типу
            const upsertData = {
                id: latestPlayerData.id,
                score: latestPlayerData.score,
                username: latestPlayerData.username,
                first_name: latestPlayerData.first_name,
                last_name: latestPlayerData.last_name,
                updated_at: new Date().toISOString()
            };
            
            // Выполняем один запрос вместо множества
            const { error } = await this.supabase
                .from('players')
                .upsert([upsertData], { onConflict: 'id' });
            
            if (error) throw error;
            
            // Очищаем очередь
            this.requestQueue = [];
            this.retryCount = 0;
            
        } catch (error) {
            console.error('Ошибка пакетной записи:', error);
            this.retryCount++;
            
            if (this.retryCount < this.maxRetries) {
                // Повторная попытка с экспоненциальной задержкой
                const delay = Math.pow(2, this.retryCount) * 1000;
                setTimeout(() => this.processQueue(), delay);
            } else {
                // После неудачных попыток сохраняем в localStorage
                console.warn('Не удалось сохранить в БД, используем локальное хранилище');
                this.requestQueue = [];
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    // Оптимизированная загрузка рейтинга с кэшированием
    async getLeaderboard(cacheEnabled = true) {
        const now = Date.now();
        
        // Проверяем кэш
        if (cacheEnabled && 
            this.localCache.leaderboard && 
            now < this.localCache.leaderboardExpiry) {
            return this.localCache.leaderboard;
        }
        
        try {
            // Загружаем только топ-50 + позицию текущего игрока
            const { data: topPlayers, error } = await this.supabase
                .from('players')
                .select('id, score, username, first_name, last_name')
                .order('score', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            // Кэшируем результат
            this.localCache.leaderboard = topPlayers || [];
            this.localCache.leaderboardExpiry = now + CONFIG.LEADERBOARD_CACHE_TTL;
            
            return topPlayers || [];
            
        } catch (error) {
            console.error('Ошибка загрузки рейтинга:', error);
            return this.localCache.leaderboard || [];
        }
    }
    
    // Загрузка позиции конкретного игрока
    async getPlayerPosition(playerId) {
        try {
            const { count, error } = await this.supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .gt('score', (await this.getPlayerScore(playerId)).score);
            
            if (error) throw error;
            return (count || 0) + 1;
            
        } catch (error) {
            console.error('Ошибка получения позиции:', error);
            return null;
        }
    }
    
    async getPlayerScore(playerId) {
        try {
            const { data, error } = await this.supabase
                .from('players')
                .select('score')
                .eq('id', playerId)
                .single();
            
            if (error) throw error;
            return data;
            
        } catch (error) {
            return { score: 0 };
        }
    }
    
    // Синхронизация с дедупликацией
    async syncPlayerData(playerId, userData, gameState) {
        const pendingChanges = gameState.getPendingChanges();
        
        // Проверка на подозрительные изменения
        if (Math.abs(pendingChanges.scoreDelta) > CONFIG.MAX_SCORE_DELTA_PER_SYNC) {
            console.warn('Подозрительное изменение счета, требуется дополнительная проверка');
            // Можно добавить дополнительную валидацию
        }
        
        const playerData = {
            id: playerId,
            score: Math.floor(gameState.state.score),
            username: userData.username,
            first_name: userData.first_name,
            last_name: userData.last_name,
        };
        
        await this.batchUpsertPlayer(playerData);
        gameState.resetPendingChanges();
    }
}

// ============================================
// 4. МЕНЕДЖЕР РЕФЕРАЛОВ
// ============================================
class ReferralManager {
    constructor(supabaseClient, telegramUser) {
        this.supabase = supabaseClient;
        this.telegramUser = telegramUser;
        this.referralCode = localStorage.getItem('referral_code');
        this.invitedFriends = parseInt(localStorage.getItem('invited_friends') || '0');
    }
    
    getReferralCode() {
        if (this.referralCode) return this.referralCode;
        
        if (this.telegramUser && this.telegramUser.id) {
            this.referralCode = 'ref_' + this.telegramUser.id;
        } else {
            this.referralCode = 'ref_' + Math.random().toString(36).substring(2, 10);
        }
        
        localStorage.setItem('referral_code', this.referralCode);
        return this.referralCode;
    }
    
    getReferralLink(botUsername = 'NewPeopleGameBot') {
        const code = this.getReferralCode();
        return `https://t.me/${botUsername}?start=${code}`;
    }
    
    async processReferral(startParam) {
        if (!startParam || !this.supabase) return;
        
        const alreadyProcessed = localStorage.getItem('referral_processed_' + startParam);
        if (alreadyProcessed) return;
        
        try {
            const referrerId = startParam.replace('ref_', '');
            
            // Проверяем существование реферера
            const { data: referrer } = await this.supabase
                .from('players')
                .select('id')
                .eq('id', referrerId)
                .single();
            
            if (referrer && this.telegramUser) {
                const currentUserId = this.telegramUser.id.toString();
                
                // Проверяем дубликат
                const { data: existing } = await this.supabase
                    .from('referrals')
                    .select('*')
                    .eq('referred_id', currentUserId)
                    .single();
                
                if (!existing) {
                    await this.supabase
                        .from('referrals')
                        .insert([{
                            referrer_id: referrerId,
                            referred_id: currentUserId,
                            reward_given: false
                        }]);
                }
            }
            
            localStorage.setItem('referral_processed_' + startParam, 'true');
            
        } catch (error) {
            console.error('Ошибка обработки реферала:', error);
        }
    }
    
    async checkAndClaimRewards() {
        if (!this.supabase || !this.telegramUser) {
            return { success: false, message: 'База данных не подключена' };
        }
        
        try {
            const currentUserId = this.telegramUser.id.toString();
            
            const { data: referrals, error } = await this.supabase
                .from('referrals')
                .select('*')
                .eq('referrer_id', currentUserId);
            
            if (error) throw error;
            if (!referrals || referrals.length === 0) {
                return { success: false, message: 'Нет рефералов' };
            }
            
            const newReferrals = referrals.filter(r => !r.reward_given);
            if (newReferrals.length === 0) {
                return { success: false, message: 'Все награды получены' };
            }
            
            const rewardPerFriend = 10000;
            const totalReward = newReferrals.length * rewardPerFriend;
            
            // Обновляем статус наград
            for (const referral of newReferrals) {
                await this.supabase
                    .from('referrals')
                    .update({ reward_given: true })
                    .eq('id', referral.id);
            }
            
            this.invitedFriends = referrals.length;
            localStorage.setItem('invited_friends', this.invitedFriends);
            
            return {
                success: true,
                reward: totalReward,
                invitedCount: this.invitedFriends
            };
            
        } catch (error) {
            console.error('Ошибка проверки наград:', error);
            return { success: false, message: error.message };
        }
    }
}

// ============================================
// 5. ОСНОВНОЙ КЛАСС ПРИЛОЖЕНИЯ
// ============================================
class TapGameApp {
    constructor() {
        this.gameState = new GameStateManager();
        this.db = null;
        this.referralManager = null;
        this.supabase = null;
        this.telegramUser = null;
        this.syncTimer = null;
        this.tickTimer = null;
        
        this.init();
    }
    
    async init() {
        // Инициализация Telegram WebApp
        const tg = window.Telegram?.WebApp;
        if (tg) {
            tg.ready();
            tg.expand();
            this.telegramUser = tg.initDataUnsafe?.user || null;
            
            // Получаем параметр start для реферальной системы
            const initData = tg.initDataUnsafe;
            if (initData && initData.start_param) {
                this.startParam = initData.start_param;
            }
        }
        
        // Инициализация Supabase
        await this.initSupabase();
        
        // Загрузка состояния игры
        this.gameState.loadFromLocal();
        
        // Инициализация менеджеров
        if (this.supabase) {
            this.db = new DatabaseManager(this.supabase);
            this.referralManager = new ReferralManager(this.supabase, this.telegramUser);
            
            // Обработка реферала
            if (this.startParam) {
                await this.referralManager.processReferral(this.startParam);
            }
            
            // Первоначальная синхронизация
            await this.syncWithDatabase();
        }
        
        // Запуск игровых циклов
        this.startGameLoops();
        
        // Привязка UI
        this.bindUI();
        
        // Первичное обновление UI
        this.updateUI();
    }
    
    async initSupabase() {
        if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
            try {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
                console.log('✓ Supabase подключен');
            } catch (error) {
                console.error('✗ Ошибка подключения Supabase:', error);
            }
        }
    }
    
    startGameLoops() {
        // Основной игровой тик (регенерация и пассивный доход)
        this.tickTimer = setInterval(() => {
            this.gameState.tick();
            this.updateUI();
            
            // Сохраняем в localStorage каждую секунду
            this.gameState.saveToLocal();
        }, 1000);
        
        // Синхронизация с БД
        this.scheduleNextSync();
    }
    
    scheduleNextSync() {
        if (this.syncTimer) clearTimeout(this.syncTimer);
        
        const interval = this.gameState.state.syncInterval;
        this.syncTimer = setTimeout(() => {
            this.syncWithDatabase();
            this.scheduleNextSync();
        }, interval);
    }
    
    async syncWithDatabase() {
        if (!this.supabase || !this.telegramUser) return;
        
        const userData = {
            username: (this.telegramUser.first_name + ' ' + (this.telegramUser.last_name || '')).trim(),
            first_name: this.telegramUser.first_name,
            last_name: this.telegramUser.last_name,
        };
        
        await this.db.syncPlayerData(
            this.telegramUser.id.toString(),
            userData,
            this.gameState
        );
    }
    
    bindUI() {
        const slonBtn = document.getElementById('slonBtn');
        if (slonBtn) {
            slonBtn.addEventListener('touchstart', (e) => this.handleTap(e), { passive: false });
            slonBtn.addEventListener('mousedown', (e) => this.handleTap(e));
        }
        
        // Навигация
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => this.handleNavigation(item));
        });
        
        // Сохранение при закрытии
        window.addEventListener('beforeunload', () => {
            this.syncWithDatabase();
            this.gameState.saveToLocal();
        });
        
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.syncWithDatabase();
            }
        });
    }
    
    handleTap(e) {
        e.preventDefault();
        const success = this.gameState.handleTap(this.gameState.state.clickPower);
        
        if (success) {
            this.createPopUp(e);
            this.updateUI();
            
            // Вибрация
            if (window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        }
    }
    
    createPopUp(e) {
        const clickArea = document.getElementById('clickArea');
        const pop = document.createElement('div');
        pop.classList.add('tap-pop');
        pop.textContent = `+${this.gameState.state.clickPower}`;
        
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[e.touches.length - 1].clientX;
            clientY = e.touches[e.touches.length - 1].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const rect = clickArea.getBoundingClientRect();
        pop.style.left = `${clientX - rect.left - 15}px`;
        pop.style.top = `${clientY - rect.top - 30}px`;
        
        clickArea.appendChild(pop);
        setTimeout(() => pop.remove(), 600);
    }
    
    handleNavigation(navItem) {
        const navItems = document.querySelectorAll('.nav-item');
        const screens = document.querySelectorAll('.screen');
        
        navItems.forEach(nav => nav.classList.remove('active'));
        navItem.classList.add('active');
        
        const targetScreenId = navItem.getAttribute('data-screen');
        screens.forEach(screen => {
            screen.classList.toggle('active', screen.id === targetScreenId);
            
            if (targetScreenId === 'screen-tasks') {
                this.renderTasks();
            } else if (targetScreenId === 'screen-leaderboard') {
                this.renderLeaderboard();
            } else if (targetScreenId === 'screen-upgrade') {
                this.renderUpgrades();
            } else if (targetScreenId === 'screen-friends') {
                this.renderRewards();
            }
        });
    }
    
    updateUI() {
        const state = this.gameState.state;
        
        // Score
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = Math.floor(state.score).toLocaleString('ru-RU');
        }
        
        // VPH
        const vphDisplay = document.getElementById('vphDisplay');
        if (vphDisplay) {
            vphDisplay.textContent = `+${state.profitPerHour.toLocaleString('ru-RU')}/час`;
        }
        
        // Energy
        const energyTextEl = document.getElementById('energyText');
        const energyFillEl = document.getElementById('energyFill');
        if (energyTextEl && energyFillEl) {
            energyTextEl.textContent = `${Math.floor(state.energy)} / ${state.maxEnergy}`;
            energyFillEl.style.width = `${(state.energy / state.maxEnergy) * 100}%`;
        }
        
        // Rank
        const rankNameEl = document.getElementById('rankName');
        const rankIconEl = document.getElementById('rankIcon');
        const levelFillEl = document.getElementById('levelFill');
        
        if (rankNameEl && rankIconEl) {
            const rank = this.gameState.getCurrentRank();
            rankNameEl.textContent = rank.name;
            rankIconEl.textContent = rank.icon;
        }
        
        if (levelFillEl) {
            levelFillEl.style.width = `${this.gameState.getRankProgress()}%`;
        }
    }
    
    async renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = '<p style="text-align:center; opacity:0.7;">Загрузка...</p>';
        
        let players = [];
        
        if (this.db) {
            players = await this.db.getLeaderboard(true);
        }
        
        // Форматируем игроков
        const formattedPlayers = players.map(p => ({
            id: p.id,
            name: p.username || p.first_name || 'Игрок',
            score: p.score || 0,
            avatar: this.getAvatarForUser(p),
            isMe: this.telegramUser && p.id === this.telegramUser.id.toString()
        }));
        
        // Добавляем текущего игрока если его нет в топе
        if (this.telegramUser) {
            const currentPlayer = {
                id: this.telegramUser.id.toString(),
                name: (this.telegramUser.first_name + ' ' + (this.telegramUser.last_name || '')).trim(),
                score: Math.floor(this.gameState.state.score),
                avatar: this.getAvatarForUser(this.telegramUser),
                isMe: true
            };
            
            const exists = formattedPlayers.some(p => p.id === currentPlayer.id);
            if (!exists) {
                formattedPlayers.push(currentPlayer);
            }
        }
        
        // Сортировка
        formattedPlayers.sort((a, b) => b.score - a.score);
        
        // Рендер
        leaderboardList.innerHTML = '';
        formattedPlayers.slice(0, 50).forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'leaderboard-item';
            if (index === 0) card.classList.add('top-1');
            if (index === 1) card.classList.add('top-2');
            if (index === 2) card.classList.add('top-3');
            if (player.isMe) card.classList.add('leaderboard-me');
            
            card.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-avatar">${player.avatar}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-name">${player.name}${player.isMe ? ' (Вы)' : ''}</div>
                    <div class="leaderboard-score">${player.score.toLocaleString('ru-RU')} 🗳️</div>
                </div>
            `;
            leaderboardList.appendChild(card);
        });
    }
    
    getAvatarForUser(user) {
        const avatars = ['🦁', '🐯', '🦅', '🐺', '🦊', '🐻', '🐼', '🐨', '🐸', '🐙', '🦄', '🐲', '🐘', '🦉', '🦋'];
        if (user.first_name) {
            const charCode = user.first_name.charCodeAt(0);
            return avatars[charCode % avatars.length];
        }
        return '👤';
    }
    
    renderUpgrades() {
        const upgradesList = document.getElementById('upgradesList');
        if (!upgradesList) return;
        
        const upgrades = [
            { id: 'leaflets', name: 'Печать листовок', baseCost: 100, bonus: 100, icon: '📄', level: 0 },
            { id: 'social', name: 'SMM-менеджер', baseCost: 500, bonus: 400, icon: '📱', level: 0 },
            { id: 'meeting', name: 'Организация митинга', baseCost: 2000, bonus: 1500, icon: '🎤', level: 0 },
            { id: 'office', name: 'Аренда штаба', baseCost: 5000, bonus: 3000, icon: '🏢', level: 0 },
            { id: 'tv', name: 'Эфир на ТВ', baseCost: 15000, bonus: 8000, icon: '📺', level: 0 },
        ];
        
        // Восстанавливаем уровни из состояния
        if (this.gameState.state.upgrades) {
            this.gameState.state.upgrades.forEach(saved => {
                const upgrade = upgrades.find(u => u.id === saved.id);
                if (upgrade) upgrade.level = saved.level;
            });
        }
        
        upgradesList.innerHTML = '';
        upgrades.forEach((upgrade, index) => {
            const cost = this.gameState.getUpgradeCost(upgrade);
            const canBuy = this.gameState.state.score >= cost;
            
            const card = document.createElement('div');
            card.className = `upgrade-card ${canBuy ? '' : 'disabled'}`;
            card.onclick = () => {
                if (canBuy && this.gameState.buyUpgrade(index, upgrades)) {
                    this.updateUI();
                    this.renderUpgrades();
                }
            };
            
            card.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name} <span style="font-size:10px; opacity:0.7">Ур. ${upgrade.level}</span></div>
                    <div class="upgrade-bonus">+${upgrade.bonus} голосов/час</div>
                </div>
                <div class="upgrade-cost">${cost.toLocaleString('ru-RU')}</div>
            `;
            upgradesList.appendChild(card);
        });
    }
    
    renderRewards() {
        const rewardsList = document.getElementById('rewardsList');
        if (!rewardsList) return;
        
        const rewards = [
            { id: 'merch_sticker', name: 'Стикерпак "Новые"', desc: 'Эксклюзивный набор стикеров для Telegram', cost: 5000, icon: '🎨' },
            { id: 'merch_cap', name: 'Фирменная кепка', desc: 'Бирюзовая кепка с логотипом партии', cost: 25000, icon: '🧢' },
            { id: 'edu_course', name: 'Курс "Политтехнолог"', desc: 'Доступ к закрытому образовательному модулю', cost: 50000, icon: '🎓' },
            { id: 'internship', name: 'Стажировка в Госдуме', desc: 'Реальная возможность попасть в аппарат (Топ-100)', cost: 100000, icon: '🏛️' },
            { id: 'meeting_leader', name: 'Завтрак с лидером', desc: 'Личная встреча с руководством движения', cost: 500000, icon: '🤝' }
        ];
        
        rewardsList.innerHTML = '';
        rewards.forEach(reward => {
            const canClaim = this.gameState.state.score >= reward.cost;
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
                    <button class="claim-reward-btn" ${canClaim ? '' : 'disabled'} onclick="alert('Поздравляем! Вы оформили заявку на \\"${reward.name}\\".')">
                        ${canClaim ? 'Получить' : 'Недоступно'}
                    </button>
                </div>
            `;
            rewardsList.appendChild(card);
        });
    }
    
    renderTasks() {
        const tasksContainer = document.querySelector('#screen-tasks .placeholder-content');
        if (!tasksContainer) return;
        
        tasksContainer.innerHTML = '<h2>💼 Поручения</h2>';
        
        // Задание 1: Подписка
        const taskSubscribedCompleted = localStorage.getItem('task_subscribed_completed') === 'true';
        const taskSubscribedVisited = localStorage.getItem('task_subscribed_visited') === 'true';
        
        const subscribeTaskDiv = document.createElement('div');
        subscribeTaskDiv.className = 'task-item';
        subscribeTaskDiv.innerHTML = `
            <h3>Подписаться на канал @partynewpeople</h3>
            <p>Подпишитесь на наш официальный канал и получите награду!</p>
            <p>Награда: 5000 голосов</p>
            <button onclick="completeSubscribeTask()" ${taskSubscribedCompleted ? 'disabled' : ''}>
                ${taskSubscribedCompleted ? 'Выполнено!' : (taskSubscribedVisited ? 'Получить награду' : 'Сначала перейдите по ссылке')}
            </button>
            <a href="#" onclick="event.preventDefault(); markLinkVisited();">Перейти к каналу</a>
        `;
        tasksContainer.appendChild(subscribeTaskDiv);
        
        // Задание 2: Рефералы
        const inviteTaskDiv = document.createElement('div');
        inviteTaskDiv.className = 'task-item';
        const invitedFriends = localStorage.getItem('invited_friends') || '0';
        const referralLink = this.referralManager ? this.referralManager.getReferralLink() : '';
        
        inviteTaskDiv.innerHTML = `
            <h3>👥 Пригласить друга</h3>
            <p>Пригласи друга в игру "Тапай за Новых" и получи бонус!</p>
            <p>Награда: 10000 голосов за каждого друга</p>
            <p style="font-size: 11px; opacity: 0.7; margin-top: 5px;">Приглашено друзей: ${invitedFriends}</p>
            <p style="font-size: 10px; opacity: 0.5; margin-top: 3px; word-break: break-all;">${referralLink}</p>
            <button onclick="inviteFriend()" style="margin-top: 8px; background: #00ffcc;">📤 Поделиться ссылкой</button>
            <button onclick="completeInviteTask()" style="margin-top: 5px; background: #4CAF50;">
                💰 Проверить и получить награду
            </button>
        `;
        tasksContainer.appendChild(inviteTaskDiv);
    }
}

// ============================================
// 6. ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ UI
// ============================================
let appInstance = null;

function completeSubscribeTask() {
    const taskSubscribedCompleted = localStorage.getItem('task_subscribed_completed') === 'true';
    const taskSubscribedVisited = localStorage.getItem('task_subscribed_visited') === 'true';
    
    if (taskSubscribedCompleted) {
        alert('Вы уже получали награду за подписку!');
        return;
    }
    if (!taskSubscribedVisited) {
        alert('Сначала перейдите по ссылке на канал!');
        return;
    }
    
    const reward = 5000;
    if (appInstance) {
        appInstance.gameState.state.score += reward;
        appInstance.gameState.saveToLocal();
        appInstance.updateUI();
    }
    
    localStorage.setItem('task_subscribed_completed', 'true');
    alert(`Поздравляем! Вы получили ${reward} голосов за подписку!`);
}

function markLinkVisited() {
    localStorage.setItem('task_subscribed_visited', 'true');
    window.open('https://t.me/partynewpeople', '_blank');
    if (appInstance) appInstance.renderTasks();
}

function inviteFriend() {
    if (appInstance && appInstance.referralManager) {
        const tg = window.Telegram?.WebApp;
        const referralLink = appInstance.referralManager.getReferralLink();
        
        if (tg && tg.switchInlineQuery) {
            tg.switchInlineQuery(`Приглашаю тебя в игру "Тапай за Новых"! 🐘\nЗарабатывай голоса и получай крутые награды!\n\nМоя ссылка: ${referralLink}`);
        } else {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Приглашаю в "Тапай за Новых"!`, '_blank');
        }
    }
}

async function completeInviteTask() {
    if (appInstance && appInstance.referralManager) {
        const result = await appInstance.referralManager.checkAndClaimRewards();
        
        if (result.success && appInstance) {
            appInstance.gameState.state.score += result.reward;
            appInstance.gameState.saveToLocal();
            appInstance.updateUI();
            alert(`🎉 Поздравляем! Вы получили ${result.reward.toLocaleString()} голосов!`);
        } else {
            alert(result.message || 'Ошибка проверки рефералов');
        }
    } else {
        alert('База данных не подключена');
    }
}

// ============================================
// 7. ЗАПУСК ПРИЛОЖЕНИЯ
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    appInstance = new TapGameApp();
});
