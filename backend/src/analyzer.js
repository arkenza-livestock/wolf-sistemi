const axios = require('axios');
const db    = require('./database');

const WOLF_COINS = [
  'DOGEUSDT','SHIBUSDT','PEPEUSDT','FLOKIUSDT','BONKUSDT',
  'WIFUSDT','SOLUSDT','AVAXUSDT','ADAUSDT','XRPUSDT',
  'LINKUSDT','UNIUSDT','AAVEUSDT','SUSHIUSDT','CRVUSDT',
  'FTMUSDT','ARBUSDT','OPUSDT','GMXUSDT','INJUSDT',
  'KASUSDT','PYTHUSDT','ONDOUSDT','JUPUSDT','PENGUUSDT',
  'MANAUSDT','BTCUSDT','ETHUSDT','BNBUSDT','DOTUSDT',
  'ATOMUSDT','NEARUSDT','APTUSDT','SUIUSDT','SEIUSDT',
  'TIAUSDT','ALTUSDT','AIUSDT','WLDUSDT','FETUSDT',
  'AGIXUSDT','RENDERUSDT','GRTUSDT','APEUSDT','SANDUSDT',
  'AXSUSDT','GALAUSDT','ILVUSDT','RNDRUSDT','TRUUSDT'
];

class WolfAnalyzer {
  constructor() {
    this.running   = false;
    this.interval  = null;
    this.scanCount = 0;
    this.lastScan  = null;
  }

  getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    return Object.fromEntries(rows.map(function(r) { return [r.key, r.value]; }));
  }

  async fetchCandles(symbol) {
    const res = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol: symbol, interval: '1m', limit: 100 },
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 8000
    });
    return res.data;
  }

  analyzeSignal(candles, symbol) {
    if (!candles || candles.length < 50) return null;

    const closes  = candles.map(function(c) { return parseFloat(c[4]); });
    const volumes = candles.map(function(c) { return parseFloat(c[7]); });

    const curr   = closes[closes.length - 1];
    const prev1  = closes[closes.length - 2];
    const prev5  = closes[closes.length - 6]  || closes[0];
    const prev15 = closes[closes.length - 16] || closes[0];
    const prev30 = closes[closes.length - 31] || closes[0];

    const change1  = ((curr - prev1)  / prev1)  * 100;
    const change5  = ((curr - prev5)  / prev5)  * 100;
    const change15 = ((curr - prev15) / prev15) * 100;
    const change30 = ((curr - prev30) / prev30) * 100;

    const avgVol    = volumes.slice(-20).reduce(function(a,b) { return a+b; }, 0) / 20;
    const lastVol   = volumes[volumes.length - 1];
    const volSpike  = lastVol > avgVol * 1.5;
    const volatility = Math.abs(change5);

    var signal_type = 'NONE';
    var emoji       = '';
    var confidence  = 0;

    if      (change1 > 2.5  && change5 > 2   && volSpike) { signal_type='EXTREME_PUMP'; emoji='🚀🚀'; confidence=98; }
    else if (change1 < -2.5 && change5 < -2  && volSpike) { signal_type='EXTREME_DUMP'; emoji='💥💥'; confidence=98; }
    else if (change1 > 1.8  && change5 > 1.5 && volSpike) { signal_type='STRONG_PUMP';  emoji='🚀';   confidence=90; }
    else if (change1 < -1.8 && change5 < -1.5&& volSpike) { signal_type='STRONG_DUMP';  emoji='💥';   confidence=90; }
    else if (change1 > 1.0  && change5 > 0.8 && volSpike) { signal_type='PUMP';         emoji='📈';   confidence=75; }
    else if (change1 < -1.0 && change5 < -0.8&& volSpike) { signal_type='DUMP';         emoji='📉';   confidence=75; }
    else if (change1 > 0.5  && volSpike)                   { signal_type='WEAK_PUMP';    emoji='🟢';   confidence=50; }
    else if (change1 < -0.5 && volSpike)                   { signal_type='WEAK_DUMP';    emoji='🔴';   confidence=50; }

    if (signal_type === 'NONE') return null;

    return {
      symbol:       symbol,
      signal_type:  signal_type,
      emoji:        emoji,
      confidence:   confidence,
      change1:      parseFloat(change1.toFixed(3)),
      change5:      parseFloat(change5.toFixed(3)),
      change15:     parseFloat(change15.toFixed(3)),
      change30:     parseFloat(change30.toFixed(3)),
      price:        curr,
      volume_spike: volSpike ? 1 : 0,
      volatility:   parseFloat(volatility.toFixed(2))
    };
  }

  async sendTelegram(result, settings) {
    if (!settings.telegram_token || !settings.telegram_chat_id) return;
    const minConf = parseInt(settings.min_confidence || 50);
    if (result.confidence < minConf) return;

    const msg =
      result.emoji + ' ' + result.signal_type + ' ' + result.emoji + '\n\n' +
      'Coin: ' + result.symbol + '\n' +
      'Fiyat: $' + result.price + '\n\n' +
      'Degisim:\n' +
      '1m:  ' + result.change1 + '%\n' +
      '5m:  ' + result.change5 + '%\n' +
      '15m: ' + result.change15 + '%\n' +
      '30m: ' + result.change30 + '%\n\n' +
      'Volatilite: ' + result.volatility + '%\n' +
      'Guven: ' + result.confidence + '%\n' +
      (result.volume_spike ? 'HACIM PATLAMASI' : 'Normal Hacim');

    try {
      await axios.post(
        'https://api.telegram.org/bot' + settings.telegram_token + '/sendMessage',
        { chat_id: settings.telegram_chat_id, text: msg },
        { timeout: 5000 }
      );
    } catch(e) {
      console.error('Telegram hatasi:', e.message);
    }
  }

  async scan() {
    const baslangic = Date.now();
    const settings  = this.getSettings();
    this.scanCount++;

    console.log('WOLF TARAMA #' + this.scanCount + ' — ' + new Date().toLocaleTimeString('tr-TR'));

    db.prepare("DELETE FROM signals WHERE id NOT IN (SELECT id FROM signals ORDER BY id DESC LIMIT 500)").run();

    var signalCount = 0;

    for (var i = 0; i < WOLF_COINS.length; i++) {
      var symbol = WOLF_COINS[i];
      try {
        var candles = await this.fetchCandles(symbol);
        var result  = this.analyzeSignal(candles, symbol);

        if (!result) {
          await new Promise(function(r) { setTimeout(r, 80); });
          continue;
        }

        db.prepare(
          'INSERT INTO signals (symbol,signal_type,emoji,confidence,change1,change5,change15,change30,price,volume_spike,volatility) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        ).run(
          result.symbol, result.signal_type, result.emoji,
          result.confidence, result.change1, result.change5,
          result.change15, result.change30, result.price,
          result.volume_spike, result.volatility
        );

        signalCount++;
        console.log(result.emoji + ' ' + symbol + ': ' + result.signal_type + ' (' + result.confidence + '%)');

        await this.sendTelegram(result, settings);
        await new Promise(function(r) { setTimeout(r, 100); });

      } catch(e) {
        console.error(symbol + ' hatasi:', e.message);
        await new Promise(function(r) { setTimeout(r, 200); });
      }
    }

    var sure = Date.now() - baslangic;
    this.lastScan = new Date().toISOString();

    db.prepare('INSERT INTO scan_logs (coin_count,signal_count,duration_ms) VALUES (?,?,?)').run(
      WOLF_COINS.length, signalCount, sure
    );

    console.log('Tarama bitti (' + (sure/1000).toFixed(1) + 's) — ' + signalCount + ' sinyal');
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log('WOLF SISTEMI BASLADI');
    var self = this;
    self.scan();
    this.interval = setInterval(function() { self.scan(); }, 60000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.running  = false;
    this.interval = null;
    console.log('Wolf durduruldu.');
  }
}

module.exports = new WolfAnalyzer();
