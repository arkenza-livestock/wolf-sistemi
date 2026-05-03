const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const db       = require('./src/database');
const analyzer = require('./src/analyzer');

const app  = express();
const PORT = process.env.PORT || 3006;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// ── ANALYZER ─────────────────────────────────────────────
app.post('/api/analyzer/start', async function(req, res) {
  try { analyzer.start(); res.json({ success:true }); }
  catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/analyzer/stop', function(req, res) {
  try { analyzer.stop(); res.json({ success:true }); }
  catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/status', function(req, res) {
  try {
    const total   = db.prepare("SELECT COUNT(*) as c FROM signals").get();
    const today   = db.prepare("SELECT COUNT(*) as c FROM signals WHERE date(created_at)=date('now')").get();
    const lastLog = db.prepare("SELECT * FROM scan_logs ORDER BY created_at DESC LIMIT 1").get();
    res.json({
      running:          analyzer.running,
      scanCount:        analyzer.scanCount,
      lastScan:         analyzer.lastScan,
      totalSignals:     total.c,
      todaySignals:     today.c,
      lastScanDuration: lastLog ? lastLog.duration_ms : 0,
    });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── SİNYALLER ────────────────────────────────────────────
app.get('/api/signals', function(req, res) {
  try {
    const limit  = parseInt(req.query.limit) || 100;
    const type   = req.query.type || '';
    var query, params;

    if (type) {
      query  = "SELECT * FROM signals WHERE id IN (SELECT MAX(id) FROM signals WHERE signal_type=? GROUP BY symbol) ORDER BY created_at DESC LIMIT ?";
      params = [type, limit];
    } else {
      query  = "SELECT * FROM signals WHERE id IN (SELECT MAX(id) FROM signals GROUP BY symbol) ORDER BY created_at DESC LIMIT ?";
      params = [limit];
    }

    res.json(db.prepare(query).all(...params));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/signals/latest', function(req, res) {
  try {
    const signals = db.prepare("SELECT * FROM signals WHERE id IN (SELECT MAX(id) FROM signals GROUP BY symbol) ORDER BY created_at DESC LIMIT 50").all();
    res.json(signals);
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.get('/api/signals/stats', function(req, res) {
  try {
    const byType   = db.prepare("SELECT signal_type, COUNT(*) as count, AVG(confidence) as avg_conf FROM signals GROUP BY signal_type ORDER BY count DESC").all();
    const bySymbol = db.prepare("SELECT symbol, COUNT(*) as count FROM signals GROUP BY symbol ORDER BY count DESC LIMIT 10").all();
    const hourly   = db.prepare("SELECT strftime('%H', created_at) as hour, COUNT(*) as count FROM signals WHERE date(created_at)=date('now') GROUP BY hour ORDER BY hour").all();
    res.json({ byType, bySymbol, hourly });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── SCAN LOGS ────────────────────────────────────────────
app.get('/api/scan-logs', function(req, res) {
  try {
    res.json(db.prepare("SELECT * FROM scan_logs ORDER BY created_at DESC LIMIT 20").all());
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── AYARLAR ──────────────────────────────────────────────
app.get('/api/settings', function(req, res) {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    res.json(Object.fromEntries(rows.map(function(r) { return [r.key, r.value]; })));
  } catch(e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/settings', function(req, res) {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      const ex = db.prepare('SELECT key FROM settings WHERE key=?').get(key);
      if (ex) db.prepare('UPDATE settings SET value=? WHERE key=?').run(String(value), key);
      else    db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(key, String(value));
    }
    res.json({ success:true });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// ── FRONTEND ─────────────────────────────────────────────
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// ── SUNUCU ───────────────────────────────────────────────
const http      = require('http');
const WebSocket = require('ws');
const server    = http.createServer(app);

global.wss = new WebSocket.Server({ server });
global.wss.on('connection', function(ws) {
  ws.send(JSON.stringify({ type:'CONNECTED' }));
});

server.listen(PORT, function() {
  console.log('Wolf Sistemi: http://localhost:' + PORT);
});
