import telebot
import requests

# ⚠️ Вставьте сюда токен, который вы получили от @BotFather
BOT_TOKEN = "8777432434:AAF1TsPGRQ9Dafs3Q9hrI9MaThjW6TF0ByI"
# ⚠️ Вставьте сюда ваш личный Telegram ID (чтобы бот пересылал ссылки вам)
# Узнать свой ID можно у бота @userinfobot
ADMIN_CHAT_ID = @dbfbei 

bot = telebot.TeleBot(BOT_TOKEN)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    welcome_text = (
        "🐘 Привет! Это бот для проверки заданий игры \"Тапай за Новых!\"\n\n"
        "Если ты выложил пост в ВКонтакте с хэштегом #новыелюди, "
        "просто отправь ссылку на этот пост сюда.\n\n"
        "Модератор проверит его, и ты получишь бонусные голоса в игре!"
    )
    bot.send_message(message.chat.id, welcome_text)

@bot.message_handler(func=lambda message: True)
def handle_link(message):
    text = message.text.lower()
    
    # Простая проверка, что это похоже на ссылку VK
    if "vk.com" in text or "vk.cc" in text:
        # Пересылаем ссылку админу для проверки
        forward_text = f"🔗 Новая ссылка на проверку от пользователя @{message.from_user.username} (ID: {message.from_user.id})\n\nСсылка: {message.text}"
        bot.send_message(ADMIN_CHAT_ID, forward_text)
        
        # Отвечаем пользователю
        bot.send_message(
            message.chat.id, 
            "✅ Ссылка успешно отправлена модератору!\n\n"
            "Как только мы проверим наличие хэштега #новыелюди, мы начислим тебе бонусные голоса. "
            "Обычно это занимает не более 24 часов. Спасибо за активность! 🦁"
        )
    else:
        bot.send_message(
            message.chat.id, 
            "⚠️ Пожалуйста, отправьте корректную ссылку на пост ВКонтакте (например, https://vk.com/wall-123456_789)."
        )

print("Бот запущен...")
bot.polling(none_stop=True)
