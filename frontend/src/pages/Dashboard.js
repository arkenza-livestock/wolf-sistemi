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

const Kart = ({ label, value, color, sub, icon }) => (
  <div style={{ background:'#0a0e1a', border:'1px solid #1e2736', borderRadius:10, padding:'16px 20px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <span style={{ fontSize:12, color:'#718096' }}>{label}</span>
      <span style={{ fontSize:20 }}>{icon}</span>
    </div>
    <div style={{ fontSize:22, fontWeight:800, color:color||'#e2e8f0' }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:'#4a5568', marginTop:4 }}>{sub}</div>}
  </div>
);

export default function Dashboard({ api }) {
  const [status,  setStatus]  = useState({});
  const [signals, setSignals] = useState([]);
  const [stats,   setStats]   = useState({ byType:[], bySymbol:[] });
  const [logs,    setLogs]    = useState([]);

  useEffect(function() {
    load();
    const iv = setInterval(load, 10000);
    return function() { clearInterval(iv); };
  }, [api]);

  async function load() {
    try {
      const [stRes, sigRes, statRes, logRes] = await Promise.all([
        fetch(api + '/api/status').then(r=>r.json()),
        fetch(api + '/api/signals/latest').then(r=>r.json()),
        fetch(api + '/api/signals/stats').then(r=>r.json()),
        fetch(api + '/api/scan-logs').then(r=>r.json()),
      ]);
      setStatus(stRes || {});
      setSignals(Array.isArray(sigRes) ? sigRes : []);
      setStats(statRes || { byType:[], bySymbol:[] });
      setLogs(Array.isArray(logRes) ? logRes : []);
    } catch(e) { console.error(e); }
  }

  const pumps = signals.filter(s => s.signal_type && s.signal_type.includes('PUMP')).length;
  const dumps = signals.filter(s => s.signal_type && s.signal_type.includes('DUMP')).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🐺 Wolf Dashboard</div>
          <div className="page-sub">Volatilite sinyalleri · Her 1 dakikada tarama</div>
        </div>
      </div>

      {/* Stat kartlar */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <Kart label="Bugün Sinyal"   icon="🚨" value={status.todaySignals||0}  color="#f6ad55" />
        <Kart label="Toplam Tarama"  icon="🔍" value={status.scanCount||0}     color="#60a5fa" />
        <Kart label="PUMP Sinyali"   icon="🚀" value={pumps}                   color="#68d391" />
        <Kart label="DUMP Sinyali"   icon="💥" value={dumps}                   color="#fc8181" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Son sinyaller */}
        <div className="card">
          <div className="card-title">🚨 Son Sinyaller</div>
          {signals.length === 0 ? (
            <div style={{ textAlign:'center', padding:30, color:'#4a5568', fontSize:12 }}>
              Henüz sinyal yok — Analyzer başlatın
            </div>
          ) : (
            <div>
              {signals.slice(0,8).map(function(s,i) {
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'8px 0', borderBottom:'1px solid #0d1117' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:16 }}>{s.emoji}</span>
                      <div>
                        <div style={{ fontWeight:700, color:'#e2e8f0', fontSize:13 }}>{s.symbol}</div>
                        <div style={{ fontSize:10, color:SIGNAL_COLORS[s.signal_type]||'#718096' }}>{s.signal_type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontWeight:700, color:'#f6ad55', fontSize:13 }}>{s.confidence}%</div>
                      <div style={{ fontSize:10, color:'#4a5568' }}>{trSaat(s.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* En çok sinyal veren coinler */}
        <div className="card">
          <div className="card-title">🏆 En Aktif Coinler</div>
          {stats.bySymbol && stats.bySymbol.length === 0 ? (
            <div style={{ textAlign:'center', padding:30, color:'#4a5568', fontSize:12 }}>Veri yok</div>
          ) : (
            <div>
              {(stats.bySymbol||[]).slice(0,8).map(function(s,i) {
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between',
                    padding:'8px 0', borderBottom:'1px solid #0d1117', fontSize:13 }}>
                    <span style={{ color:'#60a5fa', fontWeight:600 }}>{s.symbol}</span>
                    <span style={{ color:'#f6ad55', fontWeight:700 }}>{s.count} sinyal</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sinyal türlerine göre dağılım */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-title">📊 Sinyal Türleri</div>
        {stats.byType && stats.byType.length === 0 ? (
          <div style={{ textAlign:'center', padding:20, color:'#4a5568', fontSize:12 }}>Veri yok</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {(stats.byType||[]).map(function(s,i) {
              return (
                <div key={i} style={{ background:'#060b14', border:'1px solid #1e2736',
                  borderRadius:8, padding:'12px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:SIGNAL_COLORS[s.signal_type]||'#e2e8f0', marginBottom:4 }}>
                    {s.signal_type}
                  </div>
                  <div style={{ fontSize:20, fontWeight:800, color:'#e2e8f0' }}>{s.count}</div>
                  <div style={{ fontSize:11, color:'#718096' }}>Ort. %{Math.round(s.avg_conf)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tarama geçmişi */}
      <div className="card">
        <div className="card-title">📋 Tarama Geçmişi</div>
        {logs.length === 0 ? (
          <div style={{ textAlign:'center', padding:20, color:'#4a5568', fontSize:12 }}>Veri yok</div>
        ) : (
          <div>
            {logs.slice(0,6).map(function(l,i) {
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between',
                  padding:'8px 0', borderBottom:'1px solid #0d1117', fontSize:12 }}>
                  <div>
                    <span style={{ color:'#718096' }}>{trSaat(l.created_at)}</span>
                    <span style={{ marginLeft:12, color: l.signal_count>0?'#f6ad55':'#4a5568' }}>
                      {l.signal_count > 0 ? '🚨 ' + l.signal_count + ' sinyal' : '⚪ Sinyal yok'}
                    </span>
                  </div>
                  <span style={{ color:'#4a5568' }}>{l.coin_count} coin · {((l.duration_ms||0)/1000).toFixed(1)}s</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
