import React, { useState, useEffect } from 'react';

export default function Settings({ api }) {
  const [settings, setSettings] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(function() { load(); }, [api]);

  async function load() {
    try {
      const res  = await fetch(api + '/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch(e) { console.error(e); }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(api + '/api/settings', {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(function() { setSaved(false); }, 2000);
    } catch(e) { alert('Hata: ' + e.message); }
    setSaving(false);
  }

  function set(key, val) {
    setSettings(function(prev) {
      const next = Object.assign({}, prev);
      next[key] = val;
      return next;
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">⚙️ Ayarlar</div>
          <div className="page-sub">Wolf Sistemi konfigürasyonu</div>
        </div>
        <button onClick={save} disabled={saving}
          style={{ padding:'10px 28px', borderRadius:6, cursor:'pointer',
            fontSize:14, fontWeight:600, border:'1px solid',
            background: saved ? 'rgba(72,187,120,0.2)' : 'rgba(49,130,206,0.2)',
            borderColor: saved ? '#48bb78' : '#3182ce',
            color: saved ? '#68d391' : '#90cdf4' }}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Sol */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>📱 Telegram</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Bot Token</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                BotFather'dan alınan token</div>
              <input className="form-input" type="text"
                placeholder="123456789:ABC..."
                value={settings.telegram_token || ''}
                onChange={function(e) { set('telegram_token', e.target.value); }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Chat ID</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                Mesajın gönderileceği chat/kanal ID</div>
              <input className="form-input" type="text"
                placeholder="-1001234567890"
                value={settings.telegram_chat_id || ''}
                onChange={function(e) { set('telegram_chat_id', e.target.value); }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Min Güven Skoru (%)</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                Bu skorun altındaki sinyaller Telegram'a gönderilmez</div>
              <input className="form-input" type="number"
                placeholder="50"
                value={settings.min_confidence || ''}
                onChange={function(e) { set('min_confidence', e.target.value); }} />
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>🔍 Tarama Ayarları</div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Coin Sayısı</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                Taranacak en iyi coin sayısı (önerilen: 50)</div>
              <input className="form-input" type="number"
                placeholder="50"
                value={settings.coin_count || ''}
                onChange={function(e) { set('coin_count', e.target.value); }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Min Hacim (USDT)</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                24s minimum hacim (önerilen: 10000000)</div>
              <input className="form-input" type="number"
                placeholder="10000000"
                value={settings.min_volume || ''}
                onChange={function(e) { set('min_volume', e.target.value); }} />
            </div>

            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:12, color:'#718096',
                marginBottom:4, fontWeight:600 }}>Hacim Spike Oranı</label>
              <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>
                Ortalamaya kıyasla hacim artışı (önerilen: 1.2)</div>
              <input className="form-input" type="number" step="0.1"
                placeholder="1.2"
                value={settings.vol_spike_ratio || ''}
                onChange={function(e) { set('vol_spike_ratio', e.target.value); }} />
            </div>
          </div>
        </div>

        {/* Sağ */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>📊 Sinyal Türleri</div>
            <div style={{ fontSize:12, color:'#718096' }}>
              {[
                { emoji:'🚀🚀', name:'EXTREME_PUMP', desc:'1m >2.5% + 5m >2% + hacim' },
                { emoji:'💥💥', name:'EXTREME_DUMP', desc:'1m <-2.5% + 5m <-2% + hacim' },
                { emoji:'🚀',   name:'STRONG_PUMP',  desc:'1m >1.8% + 5m >1.5% + hacim' },
                { emoji:'💥',   name:'STRONG_DUMP',  desc:'1m <-1.8% + 5m <-1.5% + hacim' },
                { emoji:'📈',   name:'PUMP',         desc:'1m >1% + 5m >0.8% + hacim' },
                { emoji:'📉',   name:'DUMP',         desc:'1m <-1% + 5m <-0.8% + hacim' },
                { emoji:'🟢',   name:'WEAK_PUMP',    desc:'1m >0.3% + hacim spike' },
                { emoji:'🔴',   name:'WEAK_DUMP',    desc:'1m <-0.3% + hacim spike' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'7px 0', borderBottom:'1px solid #0d1117' }}>
                    <span style={{ fontWeight:600 }}>{s.emoji} {s.name}</span>
                    <span style={{ color:'#4a5568', fontSize:11 }}>{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:12,
              textTransform:'uppercase', letterSpacing:1 }}>ℹ️ Bilgi</div>
            <div style={{ fontSize:12, color:'#718096', lineHeight:1.8 }}>
              <div style={{ marginBottom:8 }}>
                🐺 <b style={{ color:'#e2e8f0' }}>Wolf Sistemi</b> her 1 dakikada
                Binance'deki en yüksek hacimli coinleri tarar.
              </div>
              <div style={{ marginBottom:8 }}>
                📊 <b style={{ color:'#e2e8f0' }}>1m/5m/15m/30m</b> değişim analizi yapılır.
              </div>
              <div style={{ marginBottom:8 }}>
                🔥 <b style={{ color:'#e2e8f0' }}>Hacim Spike</b> tespiti ile
                gerçek hareketler yakalanır.
              </div>
              <div style={{ marginBottom:8 }}>
                ⏰ Sinyaller <b style={{ color:'#e2e8f0' }}>1 saat</b> sonra otomatik silinir.
              </div>
              <div>
                🔄 Coin listesi <b style={{ color:'#e2e8f0' }}>her 10 taramada</b>
                otomatik güncellenir.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign:'right', marginTop:16 }}>
        <button onClick={save} disabled={saving}
          style={{ padding:'12px 40px', borderRadius:6, cursor:'pointer',
            fontSize:15, fontWeight:600, border:'1px solid',
            background: saved ? 'rgba(72,187,120,0.2)' : 'rgba(49,130,206,0.2)',
            borderColor: saved ? '#48bb78' : '#3182ce',
            color: saved ? '#68d391' : '#90cdf4' }}>
          {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : '💾 Kaydet'}
        </button>
      </div>
    </div>
  );
}
