import React, { useState, useEffect } from 'react';

const trSaat = (t) => t ? new Date(t).toLocaleString('tr-TR') : '-';

const SIGNAL_COLORS = {
  EXTREME_PUMP: '#f6ad55',
  EXTREME_DUMP: '#fc8181',
  STRONG_PUMP:  '#68d391',
  STRONG_DUMP:  '#fc8181',
  PUMP:         '#68d391',
  DUMP:         '#fc8181',
  WEAK_PUMP:    '#a0aec0',
  WEAK_DUMP:    '#a0aec0',
};

const SIGNAL_BG = {
  EXTREME_PUMP: 'rgba(246,173,85,0.1)',
  EXTREME_DUMP: 'rgba(252,129,129,0.1)',
  STRONG_PUMP:  'rgba(104,211,145,0.1)',
  STRONG_DUMP:  'rgba(252,129,129,0.1)',
  PUMP:         'rgba(104,211,145,0.05)',
  DUMP:         'rgba(252,129,129,0.05)',
  WEAK_PUMP:    'rgba(160,174,192,0.05)',
  WEAK_DUMP:    'rgba(160,174,192,0.05)',
};

export default function Signals({ api }) {
  const [signals,  setSignals]  = useState([]);
  const [filter,   setFilter]   = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(function() {
    load();
    const iv = setInterval(load, 15000);
    return function() { clearInterval(iv); };
  }, [api, filter]);

  async function load() {
    setLoading(true);
    try {
      const url = filter === 'ALL'
        ? api + '/api/signals?limit=200'
        : api + '/api/signals?type=' + filter + '&limit=200';
      const res  = await fetch(url);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSignals(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const FILTERS = [
    { key:'ALL',          label:'Tümü' },
    { key:'EXTREME_PUMP', label:'🚀🚀 Extreme Pump' },
    { key:'EXTREME_DUMP', label:'💥💥 Extreme Dump' },
    { key:'STRONG_PUMP',  label:'🚀 Strong Pump' },
    { key:'STRONG_DUMP',  label:'💥 Strong Dump' },
    { key:'PUMP',         label:'📈 Pump' },
    { key:'DUMP',         label:'📉 Dump' },
    { key:'WEAK_PUMP',    label:'🟢 Weak Pump' },
    { key:'WEAK_DUMP',    label:'🔴 Weak Dump' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 48px)', gap:16 }}>

      <div className="page-header">
        <div>
          <div className="page-title">🚨 Sinyaller</div>
          <div className="page-sub">{signals.length} sinyal · Her 15 saniyede güncellenir</div>
        </div>
        <div style={{ fontSize:11, color:'#4a5568' }}>{loading ? '⏳ Yükleniyor...' : ''}</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, flex:1, minHeight:0 }}>

        {/* Sol — Liste */}
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10,
          display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Filtre */}
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #1e2736', overflowX:'auto' }}>
            <div style={{ display:'flex', gap:4', flexWrap:'wrap', gap:4 }}>
              {FILTERS.map(function(f) {
                return (
                  <button key={f.key} onClick={function() { setFilter(f.key); }}
                    style={{ padding:'4px 8px', borderRadius:4, cursor:'pointer',
                      fontSize:10, fontWeight:600, border:'1px solid', whiteSpace:'nowrap',
                      background: filter===f.key ? 'rgba(246,173,85,0.2)' : 'transparent',
                      borderColor: filter===f.key ? '#f6ad55' : '#2d3748',
                      color: filter===f.key ? '#f6ad55' : '#718096' }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {signals.length === 0 ? (
              <div style={{ textAlign:'center', padding:40, color:'#4a5568', fontSize:12 }}>
                {loading ? 'Yükleniyor...' : 'Sinyal bulunamadı'}
              </div>
            ) : signals.map(function(s,i) {
              return (
                <div key={i} onClick={function() { setSelected(s); }}
                  style={{ padding:'10px 12px', cursor:'pointer',
                    borderBottom:'1px solid #0d1117',
                    background: selected?.id===s.id
                      ? (SIGNAL_BG[s.signal_type]||'rgba(246,173,85,0.05)')
                      : 'transparent',
                    borderLeft: selected?.id===s.id ? '3px solid #f6ad55' : '3px solid transparent',
                    transition:'all 0.1s' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:18 }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:13 }}>{s.symbol}</div>
                        <div style={{ fontSize:10, color:SIGNAL_COLORS[s.signal_type]||'#718096' }}>
                          {s.signal_type}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:800, fontSize:14, color:'#f6ad55' }}>{s.confidence}%</div>
                      <div style={{ fontSize:9, color:'#4a5568' }}>{trSaat(s.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, marginTop:4 }}>
                    <span style={{ fontSize:10,
                      color: parseFloat(s.change1) >= 0 ? '#68d391' : '#fc8181' }}>
                      1m: {parseFloat(s.change1||0) >= 0 ? '+' : ''}{s.change1}%
                    </span>
                    <span style={{ fontSize:10,
                      color: parseFloat(s.change5) >= 0 ? '#68d391' : '#fc8181' }}>
                      5m: {parseFloat(s.change5||0) >= 0 ? '+' : ''}{s.change5}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sağ — Detay */}
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10,
          overflowY:'auto', padding:'16px 20px' }}>
          {selected ? (
            <div>
              {/* Başlık */}
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:26, fontWeight:800, color:'#e2e8f0' }}>
                    {selected.emoji} {selected.symbol}
                  </div>
                  <div style={{ fontSize:12, color:'#718096', marginTop:4 }}>
                    {trSaat(selected.created_at)}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:22, fontWeight:800,
                    color: SIGNAL_COLORS[selected.signal_type]||'#e2e8f0' }}>
                    {selected.signal_type}
                  </div>
                  <div style={{ fontSize:14, color:'#f6ad55', fontWeight:700 }}>
                    {selected.confidence}% Güven
                  </div>
                </div>
              </div>

              {/* Fiyat */}
              <div style={{ background:'#060b14', border:'1px solid #1e2736',
                borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
                <div style={{ fontSize:11, color:'#718096', marginBottom:4 }}>💰 Fiyat</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#e2e8f0' }}>
                  ${parseFloat(selected.price||0).toFixed(6)}
                </div>
              </div>

              {/* Değişimler */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                {[
                  { label:'1 Dakika',  value: selected.change1 },
                  { label:'5 Dakika',  value: selected.change5 },
                  { label:'15 Dakika', value: selected.change15 },
                  { label:'30 Dakika', value: selected.change30 },
                ].map(function(item, i) {
                  const val = parseFloat(item.value || 0);
                  return (
                    <div key={i} style={{ background:'#060b14', border:'1px solid #1e2736',
                      borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:11, color:'#718096', marginBottom:6 }}>{item.label}</div>
                      <div style={{ fontSize:18, fontWeight:800,
                        color: val >= 0 ? '#68d391' : '#fc8181' }}>
                        {val >= 0 ? '+' : ''}{val.toFixed(3)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Volatilite & Hacim */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                <div style={{ background:'#060b14', border:'1px solid #1e2736',
                  borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'#718096', marginBottom:4 }}>📈 Volatilite</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#f6ad55' }}>
                    {selected.volatility}%
                  </div>
                </div>
                <div style={{ background: selected.volume_spike ? '#0d2818' : '#060b14',
                  border: '1px solid ' + (selected.volume_spike ? '#276749' : '#1e2736'),
                  borderRadius:8, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'#718096', marginBottom:4 }}>🔥 Hacim</div>
                  <div style={{ fontSize:15, fontWeight:700,
                    color: selected.volume_spike ? '#68d391' : '#a0aec0' }}>
                    {selected.volume_spike ? 'HACİM PATLAMASI' : 'Normal'}
                  </div>
                </div>
              </div>

              {/* TradingView Grafik */}
              <div style={{ background:'#060b14', border:'1px solid #1e2736',
                borderRadius:8, overflow:'hidden', height:400 }}>
                <div style={{ fontSize:11, color:'#718096', padding:'8px 12px',
                  borderBottom:'1px solid #1e2736' }}>
                  📊 {selected.symbol} — TradingView
                </div>
                <iframe
                  src={'https://www.tradingview.com/widgetembed/?frameElementId=tradingview&symbol=BINANCE:' + selected.symbol + '&interval=1&theme=dark&style=1&locale=tr&hide_top_toolbar=0&save_image=0'}
                  style={{ width:'100%', height:'360px', border:'none' }}
                  title="TradingView"
                />
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:60, color:'#4a5568' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>👈</div>
              <div>Sol taraftan bir sinyal seçin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
