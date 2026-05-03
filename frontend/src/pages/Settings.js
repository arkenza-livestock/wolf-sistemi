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

  const Input = function({ label, k, type, placeholder, desc }) {
    type = type || 'text';
    return (
      <div style={{ marginBottom:16 }}>
        <label style={{ display:'block', fontSize:12, color:'#718096', marginBottom:5, fontWeight:600 }}>
          {label}
        </label>
        {desc && <div style={{ fontSize:11, color:'#4a5568', marginBottom:5 }}>{desc}</div>}
        <input
          className="form-input"
          type={type}
          placeholder={placeholder}
          value={settings[k] || ''}
          onChange={function(e) { set(k, e.target.value); }}
        />
      </div>
    );
  };

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
          <div className="card">
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>📱 Telegram</div>
            <Input label="Bot Token" k="telegram_token"
              placeholder="123456789:ABC..."
              desc="BotFather'dan alınan token" />
            <Input label="Chat ID" k="telegram_chat_id"
              placeholder="-1001234567890"
              desc="Mesajın gönderileceği chat/kanal ID" />
            <Input label="Min Güven Skoru (%)" k="min_confidence" type="number"
              placeholder="50"
              desc="Bu skorun altındaki sinyaller Telegram'a gönderilmez" />
          </div>
        </div>

        {/* Sağ */}
        <div>
          <div className="card">
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>📊 Sinyal Türleri</div>
            <div style={{ fontSize:12, color:'#718096', lineHeight:2.2 }}>
              {[
                { emoji:'🚀🚀', name:'EXTREME_PUMP', desc:'1m >2.5% + 5m >2% + hacim' },
                { emoji:'💥💥', name:'EXTREME_DUMP', desc:'1m <-2.5% + 5m <-2% + hacim' },
                { emoji:'🚀',   name:'STRONG_PUMP',  desc:'1m >1.8% + 5m >1.5% + hacim' },
                { emoji:'💥',   name:'STRONG_DUMP',  desc:'1m <-1.8% + 5m <-1.5% + hacim' },
                { emoji:'📈',   name:'PUMP',         desc:'1m >1% + 5m >0.8% + hacim' },
                { emoji:'📉',   name:'DUMP',         desc:'1m <-1% + 5m <-0.8% + hacim' },
                { emoji:'🟢',   name:'WEAK_PUMP',    desc:'1m >0.5% + hacim' },
                { emoji:'🔴',   name:'WEAK_DUMP',    desc:'1m <-0.5% + hacim' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    padding:'4px 0', borderBottom:'1px solid #0d1117' }}>
                    <span>{s.emoji} {s.name}</span>
                    <span style={{ color:'#4a5568', fontSize:11 }}>{s.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize:12, color:'#f6ad55', fontWeight:700, marginBottom:16,
              textTransform:'uppercase', letterSpacing:1 }}>🐺 Wolf Coins</div>
            <div style={{ fontSize:12, color:'#718096', lineHeight:2 }}>
              50 volatil coin izleniyor. Her 1 dakikada 1m/5m/15m/30m değişim ve hacim spike analizi yapılır.
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign:'right', marginTop:8 }}>
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
