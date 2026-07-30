import telebot
import random
import string
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from threading import Thread

# ⚠️ ВАШИ ДАННЫЕ
BOT_TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER"
ADMIN_CHAT_ID = 123456789  # Ваш Telegram ID
REWARD_AMOUNT = 10000  # Сколько очков начислять за пост

bot = telebot.TeleBot(BOT_TOKEN)
app = Flask(__name__)
CORS(app)  # Разрешаем запросы из игры

# Файл для хранения активных промокодов
PROMO_FILE = "promocodes.json"

def load_promos():
    if os.path.exists(PROMO_FILE):
        with open(PROMO_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_promos(promos):
    with open(PROMO_FILE, 'w', encoding='utf-8') as f:
        json.dump(promos, f, ensure_ascii=False, indent=2)

def generate_promo():
    return "NL-" + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

# --- ОБРАБОТКА ССЫЛОК ОТ ИГРОКОВ ---
@bot.message_handler(func=lambda message: "vk.com" in message.text.lower() or "vk.cc" in message.text.lower())
def handle_vk_link(message):
    user_id = message.from_user.id
    username = message.from_user.username or "без_ника"
    link = message.text
    
    # Сохраняем связь user_id -> link для модератора
    promo = generate_promo()
    promos = load_promos()
    promos[promo] = {"user_id": user_id, "username": username, "link": link, "amount": REWARD_AMOUNT, "used": False}
    save_promos(promos)
    
    # Отправляем админу красивое сообщение с кнопками
    admin_text = (
        f"🔗 Новая ссылка на проверку\n\n"
        f"👤 Пользователь: @{username} (ID: {user_id})\n"
        f"📎 Ссылка: {link}\n"
        f"🎁 Промокод: `{promo}`\n\n"
        f"Проверьте пост и нажмите кнопку ниже 👇"
    )
    
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(
        telebot.types.InlineKeyboardButton("✅ Начислить 10000", callback_data=f"approve_{promo}"),
        telebot.types.InlineKeyboardButton("❌ Отклонить", callback_data=f"reject_{promo}")
    )
    bot.send_message(ADMIN_CHAT_ID, admin_text, reply_markup=markup, parse_mode="Markdown")
    
    # Отвечаем игроку
    bot.send_message(
        message.chat.id,
        "📩 Ссылка принята! Ожидайте проверки модератором.\n"
        "Как только мы подтвердим выполнение, вам придёт промокод для получения бонуса в игре. 🦁"
    )

@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.send_message(
        message.chat.id,
        "🐘 Привет! Это бот игры \"Тапай за Новых!\"\n\n"
        "Выложи пост в ВК с хэштегом #новыелюди и отправь ссылку сюда. "
        "После проверки модератором ты получишь промокод на бонусные голоса!"
    )

# --- ОБРАБОТКА НАЖАТИЙ КНОПОК АДМИНОМ ---
@bot.callback_query_handler(func=lambda call: True)
def callback_handler(call):
    if call.from_user.id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "⛔ Только для администратора")
        return
    
    action, promo = call.data.split("_", 1)
    promos = load_promos()
    
    if promo not in promos:
        bot.answer_callback_query(call.id, "❌ Промокод не найден")
        return
    
    data = promos[promo]
    
    if action == "approve":
        promos[promo]["approved"] = True
        save_promos(promos)
        
        # Уведомляем админа
        bot.edit_message_text(
            f"✅ ОДОБРЕНО\n\n👤 @{data['username']}\n🎁 Промокод `{promo}` активен\n💰 Награда: {REWARD_AMOUNT} голосов",
            call.message.chat.id, call.message.message_id, parse_mode="Markdown"
        )
        
        # Отправляем промокод игроку
        bot.send_message(
            data["user_id"],
            f"🎉 Поздравляем! Ваш пост одобрен!\n\n"
            f"🎟️ Ваш промокод: `{promo}`\n"
            f"💰 Награда: {REWARD_AMOUNT} голосов\n\n"
            f"Откройте игру и введите промокод в разделе «Задания»!",
            parse_mode="Markdown"
        )
        bot.answer_callback_query(call.id, "✅ Промокод выдан игроку")
        
    elif action == "reject":
        del promos[promo]
        save_promos(promos)
        
        bot.edit_message_text(
            f"❌ ОТКЛОНЕНО\n\n👤 @{data['username']}\n📎 {data['link']}",
            call.message.chat.id, call.message.message_id
        )
        
        bot.send_message(data["user_id"], "😔 К сожалению, ваш пост не прошёл проверку. Попробуйте ещё раз!")
        bot.answer_callback_query(call.id, "❌ Отклонено")

# --- HTTP API ДЛЯ ИГРЫ (проверка промокодов) ---
@app.route('/check_promo', methods=['POST'])
def check_promo():
    data = request.json
    promo = data.get('promo', '').strip().upper()
    
    promos = load_promos()
    
    if promo in promos and promos[promo].get("approved") and not promos[promo].get("used"):
        amount = promos[promo]["amount"]
        promos[promo]["used"] = True
        save_promos(promos)
        return jsonify({"success": True, "amount": amount})
    
    return jsonify({"success": False, "error": "Неверный или уже использованный промокод"})

# --- ЗАПУСК БОТА И FLASK ОДНОВРЕМЕННО ---
def run_bot():
    bot.polling(none_stop=True)

def run_flask():
    app.run(host='0.0.0.0', port=5000)

if __name__ == "__main__":
    print("🚀 Бот и сервер запущены...")
    print("📡 API для игры доступен на http://localhost:5000/check_promo")
    
    # Запускаем Flask в отдельном потоке
    flask_thread = Thread(target=run_flask)
    flask_thread.daemon = True
    flask_thread.start()
    
    # Запускаем бота в главном потоке
    run_bot()
