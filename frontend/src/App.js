import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Signals   from './pages/Signals';
import Settings  from './pages/Settings';

const API_URL = '';

const NAV = [
  { id:'dashboard', icon:'📊', label:'Dashboard' },
  { id:'signals',   icon:'🚨', label:'Sinyaller' },
  { id:'settings',  icon:'⚙️', label:'Ayarlar' },
];

export default function App() {
  const [activePage,   setActivePage]   = useState('dashboard');
  const [running,      setRunning]      = useState(false);
  const [toggling,     setToggling]     = useState(false);
  const [totalSignals, setTotalSignals] = useState(0);
  const [lastScan,     setLastScan]     = useState(null);

  useEffect(function() {
    fetchStatus();
    const iv = setInterval(fetchStatus, 10000);
    return function() { clearInterval(iv); };
  }, []);

  async function fetchStatus() {
    try {
      const res  = await fetch(API_URL + '/api/status');
      const data = await res.json();
      setRunning(data.running || false);
      setTotalSignals(data.todaySignals || 0);
      setLastScan(data.lastScan);
    } catch(e) {}
  }

  async function toggleAnalyzer() {
    setToggling(true);
    try {
      const endpoint = running ? '/api/analyzer/stop' : '/api/analyzer/start';
      await fetch(API_URL + endpoint, { method:'POST' });
      setTimeout(fetchStatus, 1000);
    } catch(e) {}
    setToggling(false);
  }

  function trSaat(t) {
    if (!t) return '-';
    return new Date(t).toLocaleTimeString('tr-TR');
  }

  return (
    <div style={{ display:'flex', height:'100vh', background:'#060b14', color:'#e2e8f0', fontFamily:'system-ui,sans-serif' }}>

      {/* Sol menü */}
      <div style={{ width:210, background:'#0a0e1a', borderRight:'1px solid #1e2736', display:'flex', flexDirection:'column', padding:'20px 0' }}>

        {/* Logo */}
        <div style={{ padding:'0 20px 24px', borderBottom:'1px solid #1e2736' }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#f6ad55', letterSpacing:1 }}>🐺 Wolf Sistemi</div>
          <div style={{ fontSize:11, color:'#4a5568', marginTop:4 }}>Volatilite Sinyal Botu</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 0' }}>
          {NAV.map(function(item) {
            return (
              <div key={item.id}
                onClick={function() { setActivePage(item.id); }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:500,
                  color: activePage===item.id ? '#fbd38d' : '#718096',
                  background: activePage===item.id ? 'rgba(246,173,85,0.1)' : 'transparent',
                  borderLeft: activePage===item.id ? '3px solid #f6ad55' : '3px solid transparent',
                  transition:'all 0.15s'
                }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* Analyzer kontrolü */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid #1e2736' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%',
              background: running ? '#68d391' : '#fc8181',
              boxShadow:  running ? '0 0 6px #68d391' : 'none' }} />
            <span style={{ fontSize:12, fontWeight:600, color: running ? '#68d391' : '#fc8181' }}>
              {running ? 'Çalışıyor' : 'Durduruldu'}
            </span>
          </div>
          <button onClick={toggleAnalyzer} disabled={toggling}
            style={{
              width:'100%', padding:'9px', borderRadius:6, cursor:'pointer',
              fontSize:12, fontWeight:600, border:'1px solid',
              background: running ? 'rgba(252,129,129,0.15)' : 'rgba(104,211,145,0.15)',
              borderColor: running ? '#fc8181' : '#68d391',
              color: running ? '#fc8181' : '#68d391'
            }}>
            {toggling ? '...' : running ? '⏹ Durdur' : '▶ Başlat'}
          </button>
        </div>

        {/* Özet */}
        <div style={{ padding:'12px 20px', borderTop:'1px solid #1e2736' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ fontSize:11, color:'#718096' }}>Bugün</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#f6ad55' }}>{totalSignals} sinyal</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'#718096' }}>Son Tarama</span>
            <span style={{ fontSize:11, color:'#4a5568' }}>{trSaat(lastScan)}</span>
          </div>
        </div>
      </div>

      {/* Sağ içerik */}
      <div style={{ flex:1, overflow:'auto', padding:24 }}>
        {activePage==='dashboard' && <Dashboard api={API_URL} />}
        {activePage==='signals'   && <Signals   api={API_URL} />}
        {activePage==='settings'  && <Settings  api={API_URL} />}
      </div>
    </div>
  );
}
