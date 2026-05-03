import React, { useState, useEffect, useRef } from 'react';

const trSaat = function(t) { return t ? new Date(t).toLocaleString('tr-TR') : '-'; };

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

const FILTERS = [
  { key:'ALL',          label:'Tümü' },
  { key:'EXTREME_PUMP', label:'Extreme Pump' },
  { key:'EXTREME_DUMP', label:'Extreme Dump' },
  { key:'STRONG_PUMP',  label:'Strong Pump' },
  { key:'STRONG_DUMP',  label:'Strong Dump' },
  { key:'PUMP',         label:'Pump' },
  { key:'DUMP',         label:'Dump' },
  { key:'WEAK_PUMP',    label:'Weak Pump' },
  { key:'WEAK_DUMP',    label:'Weak Dump' },
];

function TradingViewWidget({ symbol }) {
  const containerRef = useRef(null);

  useEffect(function() {
    if (!containerRef.current || !symbol) return;
    containerRef.current.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width  = '100%';
    containerRef.current.appendChild(wrapper);

    const script = document.createElement('script');
    script.src   = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type  = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize:         true,
      symbol:           'BINANCE:' + symbol,
      interval:         '1',
      timezone:         'Europe/Istanbul',
      theme:            'dark',
      style:            '1',
      locale:           'tr',
      hide_top_toolbar: false,
      hide_legend:      false,
      hide_volume:      false,
      save_image:       false,
      calendar:         false,
      studies: [
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
        'BB@tv-basicstudies',
        'Volume@tv-basicstudies'
      ]
    });

    containerRef.current.appendChild(script);

    return function() {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{
        height:    '600px',
        minHeight: '600px',
        width:     '100%',
        background:'#060b14'
      }}
    />
  );
}

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
      setSelected(function(prev) {
        if (prev) {
          const updated = list.find(function(s) { return s.symbol === prev.symbol; });
          return updated || prev;
        }
        return list[0] || null;
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <div className="page-header">
        <div>
          <div className="page-title">🚨 Sinyaller</div>
          <div className="page-sub">{signals.length} sinyal · Her 15 saniyede güncellenir</div>
        </div>
        <div style={{ fontSize:11, color:'#4a5568' }}>{loading ? '⏳' : ''}</div>
      </div>

      {/* Filtre */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
        {FILTERS.map(function(f) {
          return (
            <button key={f.key} onClick={function() { setFilter(f.key); }}
              style={{ padding:'5px 10px', borderRadius:4, cursor:'pointer',
                fontSize:11, fontWeight:600, border:'1px solid', whiteSpace:'nowrap',
                background: filter===f.key ? 'rgba(246,173,85,0.2)' : 'transparent',
                borderColor: filter===f.key ? '#f6ad55' : '#2d3748',
                color: filter===f.key ? '#f6ad55' : '#718096' }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Seçili coin — grafik üstte */}
      {selected && (
        <div style={{ background:'#0a0e1a', border:'1px solid #1e2736',
          borderRadius:10, overflow:'hidden', width:'100%' }}>

          {/* Başlık */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            padding:'12px 16px', borderBottom:'1px solid #1e2736' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{selected.emoji}</span>
              <div>
                <span style={{ fontSize:18, fontWeight:800, color:'#e2e8f0' }}>{selected.symbol}</span>
                <span style={{ marginLeft:10, fontSize:13,
                  color: SIGNAL_COLORS[selected.signal_type]||'#718096', fontWeight:700 }}>
                  {selected.signal_type}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:20, alignItems:'center' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#718096' }}>Fiyat</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0' }}>
                  ${parseFloat(selected.price||0).toFixed(6)}
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#718096' }}>Güven</div>
                <div style={{ fontSize:15, fontWeight:800, color:'#f6ad55' }}>{selected.confidence}%</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#718096' }}>Volatilite</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#f6ad55' }}>{selected.volatility}%</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'#718096' }}>Hacim</div>
                <div style={{ fontSize:13, fontWeight:700,
                  color: selected.volume_spike ? '#68d391' : '#a0aec0' }}>
                  {selected.volume_spike ? '🔥 PATLAMA' : 'Normal'}
                </div>
              </div>
            </div>
          </div>

          {/* Değişimler */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)',
            borderBottom:'1px solid #1e2736' }}>
            {[
              { label:'1 Dakika',  value: selected.change1 },
              { label:'5 Dakika',  value: selected.change5 },
              { label:'15 Dakika', value: selected.change15 },
              { label:'30 Dakika', value: selected.change30 },
            ].map(function(item, i) {
              const val = parseFloat(item.value || 0);
              return (
                <div key={i} style={{ padding:'10px 16px', textAlign:'center',
                  borderRight: i < 3 ? '1px solid #1e2736' : 'none' }}>
                  <div style={{ fontSize:11, color:'#718096', marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:16, fontWeight:800,
                    color: val >= 0 ? '#68d391' : '#fc8181' }}>
                    {val >= 0 ? '+' : ''}{val.toFixed(3)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* TradingView Grafik — tam genişlik */}
          <TradingViewWidget symbol={selected.symbol} />
        </div>
      )}

      {/* Sinyal listesi */}
      <div style={{ background:'#0a0e1a', border:'1px solid #1e2736',
        borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid #1e2736',
          fontSize:12, fontWeight:700, color:'#718096' }}>
          📋 Sinyal Listesi
        </div>
        {signals.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'#4a5568', fontSize:12 }}>
            {loading ? 'Yükleniyor...' : 'Sinyal bulunamadı — Analyzer başlatın'}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #1e2736' }}>
                  {['Coin','Sinyal','Güven','1m','5m','15m','Volatilite','Hacim','Zaman'].map(function(h) {
                    return (
                      <th key={h} style={{ padding:'8px 12px', fontSize:11, color:'#718096',
                        textAlign:'left', fontWeight:600 }}>
                        {h}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {signals.map(function(s, i) {
                  const isSelected = selected && selected.symbol === s.symbol;
                  return (
                    <tr key={i} onClick={function() { setSelected(s); }}
                      style={{ cursor:'pointer', borderBottom:'1px solid #0d1117',
                        background: isSelected
                          ? (SIGNAL_BG[s.signal_type]||'rgba(246,173,85,0.05)')
                          : 'transparent' }}>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span>{s.emoji}</span>
                          <span style={{ fontWeight:700, color:'#e2e8f0', fontSize:13 }}>{s.symbol}</span>
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <span style={{ fontSize:11, fontWeight:700,
                          color: SIGNAL_COLORS[s.signal_type]||'#718096' }}>
                          {s.signal_type}
                        </span>
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:800, color:'#f6ad55' }}>
                        {s.confidence}%
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12, fontWeight:600,
                        color: parseFloat(s.change1||0) >= 0 ? '#68d391' : '#fc8181' }}>
                        {parseFloat(s.change1||0) >= 0 ? '+' : ''}{s.change1}%
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12, fontWeight:600,
                        color: parseFloat(s.change5||0) >= 0 ? '#68d391' : '#fc8181' }}>
                        {parseFloat(s.change5||0) >= 0 ? '+' : ''}{s.change5}%
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12, fontWeight:600,
                        color: parseFloat(s.change15||0) >= 0 ? '#68d391' : '#fc8181' }}>
                        {parseFloat(s.change15||0) >= 0 ? '+' : ''}{s.change15}%
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12, color:'#f6ad55' }}>
                        {s.volatility}%
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:12,
                        color: s.volume_spike ? '#68d391' : '#a0aec0' }}>
                        {s.volume_spike ? '🔥 Patlama' : 'Normal'}
                      </td>
                      <td style={{ padding:'8px 12px', fontSize:11, color:'#4a5568' }}>
                        {trSaat(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
