import telebot
import json
import os
import random
import string

# ⚠️ ВАШИ ДАННЫЕ
BOT_TOKEN = "8777432434:AAF1TsPGRQ9Dafs3Q9hrI9MaThjW6TF0ByI"
ADMIN_CHAT_ID = dbfbei  # Ваш Telegram ID
REWARD_AMOUNT = 10000

bot = telebot.TeleBot(BOT_TOKEN)

# Файл для хранения состояния промокодов
PROMO_FILE = "promos.json"
PROMO_POOL_SIZE = 50  # Сколько промокодов сгенерировать

def load_promos():
    if os.path.exists(PROMO_FILE):
        with open(PROMO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"pool": [], "pending": {}}

def save_promos(data):
    with open(PROMO_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def generate_promo():
    return "NL-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def init_promo_pool():
    """Создаёт пул промокодов, если его нет"""
    data = load_promos()
    if not data.get("pool"):
        data["pool"] = [generate_promo() for _ in range(PROMO_POOL_SIZE)]
        save_promos(data)
        print(f"✅ Создан пул из {PROMO_POOL_SIZE} промокодов")
    return data

# --- ПРИЁМ ССЫЛОК ОТ ИГРОКОВ ---
@bot.message_handler(func=lambda m: "vk.com" in m.text.lower() or "vk.cc" in m.text.lower())
def handle_vk_link(message):
    data = load_promos()
    user_id = message.from_user.id
    username = message.from_user.username or "без_ника"
    
    # Сохраняем заявку на проверку
    request_id = str(user_id) + "_" + str(message.message_id)
    data["pending"][request_id] = {
        "user_id": user_id,
        "username": username,
        "link": message.text
    }
    save_promos(data)
    
    # Сообщение админу с кнопками
    admin_text = (
        f"🔗 Новая ссылка на проверку\n\n"
        f"👤 Пользователь: @{username} (ID: {user_id})\n"
        f"📎 Ссылка: {message.text}\n\n"
        f"Проверьте пост и нажмите кнопку 👇"
    )
    
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(
        telebot.types.InlineKeyboardButton("✅ Начислить 10000", callback_data=f"approve_{request_id}"),
        telebot.types.InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_{request_id}")
    )
    bot.send_message(ADMIN_CHAT_ID, admin_text, reply_markup=markup)
    
    bot.send_message(message.chat.id, 
        "📩 Ссылка принята! Ожидайте проверки модератором.\n"
        "После подтверждения вам придёт промокод на бонусные голоса 🦁")

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.send_message(message.chat.id,
        "🐘 Привет! Это бот игры \"Тапай за Новых!\"\n\n"
        "Выложи пост в ВК с хэштегом #новыелюди и отправь ссылку сюда. "
        "После проверки модератором ты получишь промокод на бонусные голоса!")

# --- ОБРАБОТКА КНОПОК АДМИНА ---
@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.from_user.id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "⛔ Только для администратора")
        return
    
    action, request_id = call.data.split("_", 1)
    data = load_promos()
    
    if request_id not in data["pending"]:
        bot.answer_callback_query(call.id, "❌ Заявка не найдена")
        return
    
    info = data["pending"][request_id]
    
    if action == "approve":
        # Берём следующий промокод из пула
        if not data["pool"]:
            bot.answer_callback_query(call.id, "⚠️ Пул промокодов пуст! Пополните его в коде.")
            return
        
        promo = data["pool"].pop(0)  # Берём первый промокод
        del data["pending"][request_id]
        save_promos(data)
        
        # Обновляем сообщение админа
        bot.edit_message_text(
            f"✅ ОДОБРЕНО\n\n👤 @{info['username']}\n🎟️ Выдан промокод: `{promo}`\n💰 Награда: {REWARD_AMOUNT} голосов\n\n"
            f"📊 Осталось промокодов в пуле: {len(data['pool'])}",
            call.message.chat.id, call.message.message_id, parse_mode="Markdown"
        )
        
        # Отправляем промокод игроку
        bot.send_message(info["user_id"],
            f"🎉 Поздравляем! Ваш пост одобрен!\n\n"
            f"🎟️ Ваш промокод: `{promo}`\n"
            f"💰 Награда: {REWARD_AMOUNT} голосов\n\n"
            f"Откройте игру и введите промокод в разделе «Задания»!",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "✅ Промокод выдан")
        
    elif action == "reject":
        del data["pending"][request_id]
        save_promos(data)
        
        bot.edit_message_text(
            f"❌ ОТКЛОНЕНО\n\n👤 @{info['username']}\n📎 {info['link']}",
            call.message.chat.id, call.message.message_id
        )
        bot.send_message(info["user_id"], 
            "😔 К сожалению, ваш пост не прошёл проверку. Попробуйте ещё раз!")
        bot.answer_callback_query(call.id, "❌ Отклонено")

# --- ЗАПУСК ---
if __name__ == "__main__":
    print("🚀 Бот запущен...")
    data = init_promo_pool()
    print(f"📦 В пуле {len(data['pool'])} промокодов")
    print("📋 Промокоды (скопируйте в script.js):")
    for p in data["pool"]:
        print(f'    "{p}",')
    bot.polling(none_stop=True)
