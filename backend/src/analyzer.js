// combined-bot.js - TEK DOSYA (SİZİN KODUNUZ + ANİ HAREKET)
const WebSocket = require('ws');

// ============ SİZİN TECHNICALANALYSIS SINIFINIZ (AYNEN) ============
class TechnicalAnalysis {

  static calculateRSI(closes, period = 7) {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff; else losses -= diff;
    }
    const ag = gains / period, al = losses / period;
    if (al === 0) return 100;
    return parseFloat((100 - 100 / (1 + ag / al)).toFixed(2));
  }

  static calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
    return parseFloat(ema.toFixed(8));
  }

  static calculateMomentum(closes, volumes, highs, lows) {
    const len = closes.length;
    if (len < 6) return { puan: 0, desc: 'Yetersiz veri' };

    const roc1 = ((closes[len-1] - closes[len-2]) / closes[len-2]) * 100;
    const roc3 = ((closes[len-1] - closes[len-4]) / closes[len-4]) * 100;
    const roc5 = ((closes[len-1] - closes[len-6]) / closes[len-6]) * 100;
    const ivme = roc1 - (roc3 / 3);

    let ardisikYesil = 0, ardisikKirmizi = 0;
    for (let i = len-1; i >= Math.max(1, len-5); i--) {
      if (closes[i] > closes[i-1]) ardisikYesil++; else break;
    }
    for (let i = len-1; i >= Math.max(1, len-5); i--) {
      if (closes[i] < closes[i-1]) ardisikKirmizi++; else break;
    }

    const sonMum = closes[len-1] - closes[len-2];
    const sonRange = highs[len-1] - lows[len-1];
    const govdeOran = sonRange > 0 ? Math.abs(sonMum) / sonRange : 0;
    const ema5 = this.calculateEMA(closes, 5);
    const ema10 = this.calculateEMA(closes, 10);
    const emaTrend = ema5 > ema10 ? 'YUKARI' : 'ASAGI';
    const emaFark = ((ema5 - ema10) / ema10) * 100;
    const volRoc = len > 4 ? ((volumes[len-1] - volumes[len-4]) / (volumes[len-4] || 1)) * 100 : 0;

    let puan = 0;
    const desc = [];

    if      (roc1 > 0.5)  { puan += 25; desc.push(`1M:+${roc1.toFixed(2)}%`); }
    else if (roc1 > 0.2)  { puan += 15; }
    else if (roc1 > 0)    { puan +=  8; }
    else if (roc1 < -0.5) { puan -= 25; desc.push(`1M:${roc1.toFixed(2)}%`); }
    else if (roc1 < -0.2) { puan -= 15; }
    else                  { puan -=  5; }

    if      (roc3 > 1.0)  { puan += 30; desc.push(`3M:+${roc3.toFixed(2)}%`); }
    else if (roc3 > 0.5)  { puan += 20; }
    else if (roc3 > 0)    { puan += 10; }
    else if (roc3 < -1.0) { puan -= 30; desc.push(`3M:${roc3.toFixed(2)}%`); }
    else if (roc3 < -0.5) { puan -= 20; }
    else                  { puan -= 10; }

    if      (roc5 > 2.0)  { puan += 25; desc.push(`5M:+${roc5.toFixed(2)}%`); }
    else if (roc5 > 1.0)  { puan += 15; }
    else if (roc5 < -2.0) { puan -= 25; }
    else if (roc5 < -1.0) { puan -= 15; }

    if      (ivme > 0.2)  { puan += 20; desc.push('İvme artıyor'); }
    else if (ivme < -0.2) { puan -= 20; }

    if      (ardisikYesil >= 4)   { puan += 30; desc.push(`${ardisikYesil} ardışık yeşil`); }
    else if (ardisikYesil === 3)  { puan += 20; desc.push('3 ardışık yeşil'); }
    else if (ardisikYesil === 2)  { puan += 10; }
    if      (ardisikKirmizi >= 3) { puan -= 30; desc.push(`${ardisikKirmizi} ardışık kırmızı`); }

    if (govdeOran > 0.7 && sonMum > 0) { puan += 15; desc.push('Güçlü yeşil mum'); }
    else if (govdeOran > 0.7 && sonMum < 0) { puan -= 15; }

    if      (emaTrend === 'YUKARI' && emaFark > 0.1) { puan += 20; desc.push('EMA5>EMA10'); }
    else if (emaTrend === 'ASAGI'  && emaFark < -0.1) { puan -= 20; }

    if (volRoc > 50 && roc1 > 0) { puan += 15; desc.push('Hacim+fiyat artıyor'); }
    else if (volRoc > 50 && roc1 < 0) { puan -= 10; }

    return { puan, desc: desc.join('\n'), roc1, roc3, roc5, ivme, ardisikYesil, emaTrend };
  }

  static calculateVolume(closes, volumes) {
    const len = volumes.length;
    if (len < 20) return { puan: -100, desc: 'Yetersiz veri', gecerli: false };

    const sonVol = volumes[len - 1];
    const avg20  = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    const avg5   = volumes.slice(-6,  -1).reduce((a, b) => a + b, 0) / 5;

    if (avg20 === 0) return { puan: -100, desc: 'Hacim sıfır', gecerli: false, oran: 0 };

    const oran20    = parseFloat((sonVol / avg20).toFixed(2));
    const vol5Trend = avg5 > avg20 * 1.2;

    let alimVol = 0, satisVol = 0;
    for (let i = len - 5; i < len; i++) {
      if (i > 0 && closes[i] >= closes[i-1]) alimVol  += volumes[i];
      else if (i > 0)                         satisVol += volumes[i];
    }
    const toplamVol = alimVol + satisVol;
    const alimOran  = toplamVol > 0 ? (alimVol / toplamVol) * 100 : 50;

    let puan = 0;
    const desc = [];

    if      (oran20 > 5)   { puan += 60; desc.push(`🔥 ${oran20}x mega spike`); }
    else if (oran20 > 3)   { puan += 45; desc.push(`⚡ ${oran20}x spike`); }
    else if (oran20 > 2)   { puan += 30; desc.push(`📈 ${oran20}x yüksek`); }
    else if (oran20 > 1.5) { puan += 20; desc.push(`${oran20}x normal+`); }
    else if (oran20 > 1)   { puan += 10; }
    else if (oran20 > 0.7) { puan +=  5; }
    else if (oran20 > 0.4) { puan -=  5; }
    else if (oran20 > 0.2) { puan -= 15; }
    else                   { puan -= 25; desc.push('Hacim çok düşük'); }

    if (vol5Trend) { puan += 15; desc.push('Hacim trendi yukarı'); }

    if      (alimOran > 75) { puan += 30; desc.push(`💪 Alım baskısı %${alimOran.toFixed(0)}`); }
    else if (alimOran > 60) { puan += 20; desc.push(`Alım baskısı %${alimOran.toFixed(0)}`); }
    else if (alimOran < 35) { puan -= 25; desc.push(`Satış baskısı %${(100-alimOran).toFixed(0)}`); }
    else if (alimOran < 45) { puan -= 10; }

    return { puan, desc: desc.join('\n'), oran: oran20, alimOran, vol5Trend, gecerli: true, spike: oran20 > 2 };
  }

  static calculateRSIScore(rsi, settings = {}) {
    const oversold   = parseFloat(settings.rsi_oversold   || 40);
    const overbought = parseFloat(settings.rsi_overbought || 60);
    let puan = 0;
    const desc = [];

    if      (rsi < 20)         { puan += 50; desc.push(`🔥 RSI aşırı satım (${rsi}) — güçlü alım`); }
    else if (rsi < 30)         { puan += 40; desc.push(`RSI satım bölgesi (${rsi}) — alım fırsatı`); }
    else if (rsi < oversold)   { puan += 25; desc.push(`RSI düşük (${rsi}) — alım bölgesi`); }
    else if (rsi < 50)         { puan += 15; desc.push(`RSI nötr+ (${rsi})`); }
    else if (rsi < 55)         { puan +=  5; desc.push(`RSI nötr (${rsi})`); }
    else if (rsi < overbought) { puan -=  5; desc.push(`RSI yükseliyor (${rsi}) — dikkat`); }
    else if (rsi < 70)         { puan -= 15; desc.push(`RSI yüksek (${rsi}) — geç kalındı`); }
    else if (rsi < 80)         { puan -= 30; desc.push(`⚠️ RSI çok yüksek (${rsi}) — alım uygun değil`); }
    else                       { puan -= 50; desc.push(`🚫 RSI aşırı alım (${rsi}) — kesinlikle girme`); }

    return { puan, desc: desc.join('\n') };
  }

  static calculateSR(closes, highs, lows, settings = {}) {
    const lookback   = parseInt(settings.sr_lookback || 20);
    const price      = closes[closes.length - 1];
    const resistance = Math.max(...highs.slice(-lookback));
    const support    = Math.min(...lows.slice(-lookback));
    const range      = resistance - support;

    if (range === 0) return { puan: 0, desc: 'Range yok', pozisyon: 50, riskOdul: 1 };

    const pozisyon = (price - support) / range * 100;
    const riskOdul = (resistance - price) / (price - support || 1);

    let puan = 0;
    const desc = [];

    if      (pozisyon < 8)  { puan += 55; desc.push(`🔥 Desteğe çok yakın (%${pozisyon.toFixed(0)}) — ideal giriş`); }
    else if (pozisyon < 20) { puan += 40; desc.push(`Alt bölge (%${pozisyon.toFixed(0)}) — iyi giriş`); }
    else if (pozisyon < 35) { puan += 20; desc.push(`Orta-alt bölge (%${pozisyon.toFixed(0)})`); }
    else if (pozisyon < 65) { puan +=  5; desc.push(`Orta bölge (%${pozisyon.toFixed(0)})`); }
    else if (pozisyon < 80) { puan -= 15; desc.push(`Üst bölge (%${pozisyon.toFixed(0)}) — dikkat`); }
    else if (pozisyon < 92) { puan -= 30; desc.push(`Direce yakın (%${pozisyon.toFixed(0)}) — riskli`); }
    else                    { puan -= 50; desc.push(`⚠️ Direce çok yakın (%${pozisyon.toFixed(0)}) — girme`); }

    if      (riskOdul > 3)   { puan += 25; desc.push(`R/R: ${riskOdul.toFixed(1)} — mükemmel`); }
    else if (riskOdul > 2)   { puan += 15; desc.push(`R/R: ${riskOdul.toFixed(1)} — iyi`); }
    else if (riskOdul > 1)   { puan +=  5; desc.push(`R/R: ${riskOdul.toFixed(1)}`); }
    else if (riskOdul < 0.5) { puan -= 25; desc.push(`R/R: ${riskOdul.toFixed(1)} — kötü`); }

    return { puan, desc: desc.join('\n'), pozisyon, resistance, support, riskOdul };
  }

  static analyze(candles, ticker, settings = {}) {
    if (!candles || candles.length < 20) return null;

    const closes  = candles.map(c => parseFloat(c[4]));
    const highs   = candles.map(c => parseFloat(c[2]));
    const lows    = candles.map(c => parseFloat(c[3]));
    const volumes = candles.map(c => parseFloat(c[5]));
    const price   = closes[closes.length - 1];

    const momentum = this.calculateMomentum(closes, volumes, highs, lows);
    const rsi      = this.calculateRSI(closes, parseInt(settings.rsi_period || 7));
    const rsiSkor  = this.calculateRSIScore(rsi, settings);
    const hacim    = this.calculateVolume(closes, volumes);
    const sr       = this.calculateSR(closes, highs, lows, settings);

    if (!hacim.gecerli) return null;

    const vol24h = parseFloat(ticker.quoteVolume || 0);
    const minVol = parseFloat(settings.min_volume || 1000000);
    if (vol24h < minVol) return null;

    const toplamSkor = Math.round(
      momentum.puan * 0.30 +
      rsiSkor.puan  * 0.25 +
      hacim.puan    * 0.30 +
      sr.puan       * 0.15
    );

    const minScore = parseFloat(settings.min_score || 10);
    const signal   = toplamSkor >= minScore ? 'ALIM' : toplamSkor <= -15 ? 'SATIS' : 'BEKLE';
    const risk     = toplamSkor >= 60 ? 'DUSUK' : toplamSkor >= 35 ? 'ORTA' : 'YUKSEK';

    const komisyon  = parseFloat(settings.commission_rate || 0.1);
    const slippage  = parseFloat(settings.slippage_rate   || 0.05);
    const minNetKar = (komisyon + slippage) * 2 + parseFloat(settings.min_profit_percent || 1.0);

    const atrDegerleri = [];
    for (let i = 1; i < candles.length; i++) {
      const h = highs[i], l = lows[i], pc = closes[i-1];
      atrDegerleri.push(Math.max(h-l, Math.abs(h-pc), Math.abs(l-pc)));
    }
    const atr    = atrDegerleri.slice(-14).reduce((a,b) => a+b, 0) / 14;
    const atrPct = (atr / price) * 100;

    const hedefFiyat = parseFloat((price * (1 + minNetKar / 100)).toFixed(8));
    const stopFiyat  = parseFloat((price * (1 - parseFloat(settings.stop_loss_percent || 0.75) / 100)).toFixed(8));
    const riskOdul   = (hedefFiyat - price) / (price - stopFiyat || 1);

    const positive = [];
    const negative = [];

    if (momentum.puan > 0) {
      momentum.desc.split('\n').forEach(d => d && positive.push('📈 ' + d));
    } else if (momentum.puan < 0) {
      momentum.desc.split('\n').forEach(d => d && negative.push('📉 ' + d));
    }

    if (rsiSkor.puan > 0) {
      rsiSkor.desc.split('\n').forEach(d => d && positive.push('📊 ' + d));
    } else if (rsiSkor.puan < 0) {
      rsiSkor.desc.split('\n').forEach(d => d && negative.push('⚠️ ' + d));
    }

    if (hacim.puan > 0) {
      hacim.desc.split('\n').forEach(d => d && positive.push('💧 ' + d));
    } else if (hacim.puan < 0) {
      hacim.desc.split('\n').forEach(d => d && negative.push('⚠️ ' + d));
    }

    if (sr.puan > 0) {
      sr.desc.split('\n').forEach(d => d && positive.push('📍 ' + d));
    } else if (sr.puan < 0) {
      sr.desc.split('\n').forEach(d => d && negative.push('⚠️ ' + d));
    }

    return {
      symbol: ticker.symbol, price,
      change24h: parseFloat(ticker.priceChangePercent),
      volume24h: vol24h,
      signal, score: toplamSkor, risk, rsi,
      momentum: momentum.puan,
      hacimOran: hacim.oran, alimOran: hacim.alimOran,
      srPozisyon: sr.pozisyon,
      riskOdul: parseFloat(riskOdul.toFixed(2)),
      atr: parseFloat(atr.toFixed(8)),
      atrPct: parseFloat(atrPct.toFixed(3)),
      target: hedefFiyat, stopLoss: stopFiyat,
      minNetKar, positive, negative
    };
  }
}

// ============ ANİ HAREKET YAKALAMA BOTU ============
class SuddenMoveBot {
    constructor(settings = {}) {
        this.settings = {
            symbol: 'BTCUSDT',
            suddenDropThreshold: -1.0,
            suddenRiseThreshold: 1.0,
            minVolumeSpike: 1.5,
            ...settings
        };
        
        this.previousPrice = null;
        this.previousVolume = null;
        this.lastAlertTime = 0;
        this.priceHistory = [];
        this.volumeHistory = [];
        this.ws = null;
        this.candles = [];  // Mum verileri için
        this.lastProcessedCandle = null;
        
        this.stats = {
            suddenDrops: 0,
            suddenRises: 0,
            buySignals: 0
        };
    }

    start() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🚀 ANİ HAREKET + TEKNİK ANALİZ BOTU 🚀                    ║
╠════════════════════════════════════════════════════════════════╣
║ Sembol: ${this.settings.symbol.padEnd(56)}║
║ Düşüş Eşiği: %${String(this.settings.suddenDropThreshold).padEnd(53)}║
║ Yükseliş Eşiği: %${String(this.settings.suddenRiseThreshold).padEnd(52)}║
║ Min. Hacim Patlaması: ${this.settings.minVolumeSpike}x${' '.repeat(53)}║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        this.connectWebSocket();
    }

    connectWebSocket() {
        const streams = [
            `${this.settings.symbol.toLowerCase()}@miniTicker`,
            `${this.settings.symbol.toLowerCase()}@kline_1m`
        ];
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
        
        console.log(`🔌 Bağlanıyor: ${this.settings.symbol}`);
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.on('open', () => {
            console.log('✅ Bağlantı kuruldu! Ani hareketler takip ediliyor...\n');
        });
        
        this.ws.on('message', (data) => {
            try {
                const json = JSON.parse(data);
                const stream = json.stream;
                const streamData = json.data;
                
                if (stream.includes('miniTicker')) {
                    this.handleSuddenMove(streamData);
                } else if (stream.includes('kline')) {
                    this.handleKline(streamData);
                }
            } catch (err) {}
        });
        
        this.ws.on('close', () => {
            console.log('⚠️ Bağlantı koptu, 3 saniye sonra yeniden...');
            setTimeout(() => this.connectWebSocket(), 3000);
        });
    }

    handleKline(data) {
        const k = data.k;
        if (k && k.x === true) {
            const newCandle = [
                k.t, k.o, k.h, k.l, k.c, k.v, k.T, k.q, k.n, k.V, k.Q, k.B
            ];
            
            if (this.lastProcessedCandle && this.lastProcessedCandle[0] === newCandle[0]) {
                return;
            }
            
            this.candles.push(newCandle);
            if (this.candles.length > 50) this.candles.shift();
            this.lastProcessedCandle = newCandle;
        }
    }

    async handleSuddenMove(ticker) {
        const currentPrice = parseFloat(ticker.c);
        const currentVolume = parseFloat(ticker.v);
        
        this.priceHistory.push(currentPrice);
        if (this.priceHistory.length > 10) this.priceHistory.shift();
        
        this.volumeHistory.push(currentVolume);
        if (this.volumeHistory.length > 20) this.volumeHistory.shift();
        
        const avgVolume = this.volumeHistory.reduce((a, b) => a + b, 0) / (this.volumeHistory.length || 1);
        const volumeSpike = avgVolume > 0 ? currentVolume / avgVolume : 1;
        
        if (this.previousPrice !== null && this.previousPrice > 0) {
            const changePercent = ((currentPrice - this.previousPrice) / this.previousPrice) * 100;
            
            const isSuddenDrop = changePercent <= this.settings.suddenDropThreshold;
            const isSuddenRise = changePercent >= this.settings.suddenRiseThreshold;
            
            if ((isSuddenDrop || isSuddenRise) && volumeSpike >= this.settings.minVolumeSpike) {
                const now = Date.now();
                if (now - this.lastAlertTime > 5000) {
                    this.lastAlertTime = now;
                    
                    if (isSuddenDrop) {
                        this.stats.suddenDrops++;
                        await this.handleSuddenDrop(currentPrice, changePercent, volumeSpike);
                    } else {
                        this.stats.suddenRises++;
                        await this.handleSuddenRise(currentPrice, changePercent, volumeSpike);
                    }
                }
            }
        }
        
        this.displayLivePrice(currentPrice, this.previousPrice ? 
            ((currentPrice - this.previousPrice) / this.previousPrice) * 100 : 0, 
            volumeSpike);
        
        this.previousPrice = currentPrice;
        this.previousVolume = currentVolume;
    }

    async handleSuddenDrop(price, changePercent, volumeSpike) {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🔴🔴 ANİ DÜŞÜŞ TESPİT EDİLDİ 🔴🔴                     ║
╠════════════════════════════════════════════════════════════════╣
║ ⏰ Zaman: ${new Date().toLocaleTimeString().padEnd(56)}║
║ 💰 Fiyat: $${price.toFixed(2).padEnd(56)}║
║ 📉 Düşüş: %${changePercent.toFixed(2).padEnd(56)}║
║ 💧 Hacim Patlaması: ${volumeSpike.toFixed(1)}x${' '.repeat(56)}║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        await this.performAnalysis(price, changePercent, 'DROP');
    }

    async handleSuddenRise(price, changePercent, volumeSpike) {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🟢🟢 ANİ YÜKSELİŞ TESPİT EDİLDİ 🟢🟢                 ║
╠════════════════════════════════════════════════════════════════╣
║ ⏰ Zaman: ${new Date().toLocaleTimeString().padEnd(56)}║
║ 💰 Fiyat: $${price.toFixed(2).padEnd(56)}║
║ 📈 Yükseliş: +%${changePercent.toFixed(2).padEnd(55)}║
║ 💧 Hacim Patlaması: ${volumeSpike.toFixed(1)}x${' '.repeat(56)}║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        await this.performAnalysis(price, changePercent, 'RISE');
    }

    async performAnalysis(price, suddenChange, type) {
        if (this.candles.length < 20) {
            console.log(`⏳ Analiz için yeterli veri yok (${this.candles.length}/20)\n`);
            return;
        }
        
        const ticker = await this.fetchTicker();
        if (!ticker) return;
        
        const analysis = TechnicalAnalysis.analyze(this.candles, ticker, {
            min_score: 30,
            min_volume: 1000000
        });
        
        if (!analysis) return;
        
        const combinedScore = this.calculateCombinedScore(suddenChange, analysis, type);
        
        this.displayAnalysis(analysis, combinedScore, type);
        
        if (combinedScore >= 60 && analysis.signal === 'ALIM') {
            this.executeBuy(analysis, suddenChange);
        }
    }

    calculateCombinedScore(suddenChange, analysis, type) {
        let score = 0;
        
        if (type === 'DROP') {
            score += Math.min(30, Math.abs(suddenChange) * 15);
        } else {
            score -= Math.min(25, suddenChange * 10);
        }
        
        if (analysis.rsi < 30) score += 35;
        else if (analysis.rsi < 40) score += 20;
        else if (analysis.rsi > 70) score -= 30;
        
        score += analysis.momentum * 0.3;
        
        if (analysis.srPozisyon < 20) score += 20;
        else if (analysis.srPozisyon > 80) score -= 20;
        
        return Math.min(100, Math.max(-100, Math.round(score)));
    }

    displayAnalysis(analysis, combinedScore, type) {
        const emoji = combinedScore >= 60 ? '🟢' : (combinedScore <= -40 ? '🔴' : '⚪');
        const firsat = combinedScore >= 60 ? '🔥 FIRSAT' : (combinedScore <= -40 ? '⚠️ DİKKAT' : '👀 İZLE');
        
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ${emoji} TEKNİK ANALİZ SONUCU ${emoji}                                              ║
╠════════════════════════════════════════════════════════════════╣
║  📊 Kombine Skor: ${combinedScore}/100 (${firsat})${' '.repeat(56 - (20 + firsat.length))}║
║  📈 Sinyal: ${analysis.signal.padEnd(63)}║
║  🎯 RSI: ${analysis.rsi?.toFixed(1) || '?'}${' '.repeat(63)}║
║  📍 S/R Pozisyon: %${analysis.srPozisyon?.toFixed(0) || '?'}${' '.repeat(62)}║
║  💧 Hacim Oranı: ${analysis.hacimOran?.toFixed(1) || '?'}x${' '.repeat(63)}║
║  🎯 Hedef: $${analysis.target?.toFixed(2) || '?'}${' '.repeat(61)}║
║  🛑 Stop: $${analysis.stopLoss?.toFixed(2) || '?'}${' '.repeat(62)}║
╚════════════════════════════════════════════════════════════════╝
        `);
    }

    executeBuy(analysis, suddenChange) {
        this.stats.buySignals++;
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🟢🟢🟢🟢🟢 ALIM KARARI 🟢🟢🟢🟢🟢                                ║
╠════════════════════════════════════════════════════════════════╣
║  Ani %${Math.abs(suddenChange).toFixed(1)} düşüş + Teknik analiz uyumu                ║
║  💰 Giriş: $${analysis.price?.toFixed(2)}                                                 ║
║  🎯 Hedef: $${analysis.target?.toFixed(2)} (+${(((analysis.target - analysis.price) / analysis.price) * 100).toFixed(2)}%)${' '.repeat(40)}║
║  🛑 Stop: $${analysis.stopLoss?.toFixed(2)} (${analysis.riskOdul?.toFixed(2)}x Risk/Ödül)${' '.repeat(37)}║
╚════════════════════════════════════════════════════════════════╝
        `);
    }

    async fetchTicker() {
        try {
            const https = require('https');
            const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${this.settings.symbol}`;
            const response = await new Promise((resolve) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(JSON.parse(data)));
                });
            });
            return {
                symbol: response.symbol,
                priceChangePercent: parseFloat(response.priceChangePercent),
                quoteVolume: parseFloat(response.quoteVolume)
            };
        } catch {
            return null;
        }
    }

    displayLivePrice(price, changePercent, volumeSpike) {
        const changeSymbol = changePercent >= 0 ? '📈' : '📉';
        const sign = changePercent >= 0 ? '+' : '';
        const time = new Date().toLocaleTimeString();
        
        process.stdout.write(`\r${time} | ${changeSymbol} Fiyat: $${price.toFixed(2)} | Değişim: ${sign}${changePercent.toFixed(2)}% | Hacim: ${volumeSpike.toFixed(1)}x | Düşüş:${this.stats.suddenDrops} Yükseliş:${this.stats.suddenRises} Alım:${this.stats.buySignals}    `);
    }
}

// ============ BAŞLAT ============
const bot = new SuddenMoveBot({
    symbol: 'BTCUSDT',
    suddenDropThreshold: -1.0,
    suddenRiseThreshold: 1.0,
    minVolumeSpike: 1.5
});

bot.start();

process.on('SIGINT', () => {
    console.log('\n\n🛑 Bot durduruldu');
    process.exit();
});
