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
  'AGIXUSDT','RENDERUSDT','TAORUSDT','GRTUSDT','APEUSDT',
  'SANDUSDT','AXSUSDT','GALAUSDT','ILVUSDT','RNDRUSDT'
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
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  }

  async fetchCandles(symbol) {
    const res = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval:'1m', limit:100 },
      headers: { 'User-Agent':'Mozilla/5.0' },
      timeout: 8000
    });
    return res.data;
  }

  analyzeSignal(candles, symbol) {
    if (!candles || candles.length < 50) return null;

    const closes  = candles.map(c => parseFloat(c[4]));
    const volumes = candles.map(c => parseFloat(c[7]));

    const curr  = closes[closes.length - 1];
    const prev1 = closes[closes.length - 2];
    const prev5 = closes[closes.length - 6]  || closes[0];
    const prev15 = closes[closes.length - 16] || closes[0];
    const prev30 = closes[closes.length - 31] || closes[0];

    const change1  = ((curr - prev1)  / prev1)  * 100;
    const change5  = ((curr - prev5)  / prev5)  * 100;
    const change15 = ((curr - prev15) / prev15) * 100;
    const change30 = ((curr - prev30) / prev30) * 100;

    const avgVol    = volumes.slice(-20).reduce((a,b) => a+b, 0) / 20;
    const lastVol   = volumes[volumes.length - 1];
    const volSpike  = lastVol > avgVol * 1.5;
    const volatility = Math.abs(change5);

    let signal_type = 'NONE';
    let emoji       = '⚪';
    let confidence  = 0;

    if      (change1 > 2.5  && change5 > 2   && volSpike) { signal_type='EXTREME_PUMP'; emoji='🚀🚀'; confidence=98; }
    else if (change1 < -2.5 && change5 < -2  && volSpike) { signal_type='EXTREME_DUMP'; emoji='💥💥'; confidence=98; }
    else if (change1 > 1.8  && change5 > 1.5 && volSpike) { signal_type='STRONG_PUMP';  emoji='🚀';   confidence=90; }
    else if (change1 < -1.8 && change5 < -1.5&& volSpike) { signal_type='STRONG_DUMP';  emoji='💥';   confidence=90; }
    else if (change1 > 1.0  && change5 > 0.8 && volSpike) { signal_type='PUMP';         emoji='📈';   confidence=75; }
    else if (change1 < -1.0 && change5 < -0.8&& volSpike) { signal_type='DUMP';         emoji='📉';   confidence=75; }
    else if (change1 > 0.5  && volSpike)                   { signal_type='WEAK_PUMP';    emoji='🟢';   confidence=50; }
    else if (change1 < -0.5 && volSpike)
