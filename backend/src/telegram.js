const axios = require('axios');

class TelegramService {
  constructor(token, chatId) {
    this.token  = token;
    this.chatId = chatId;
  }

  async sendMessage(text) {
    if (!this.token || !this.chatId) return;
    try {
      await axios.post(
        'https://api.telegram.org/bot' + this.token + '/sendMessage',
        { chat_id: this.chatId, text, parse_mode: 'HTML' },
        { timeout: 5000 }
      );
    } catch(e) {
      console.error('Telegram hatasi:', e.message);
    }
  }
}

module.exports = TelegramService;
