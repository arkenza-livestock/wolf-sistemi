const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../data/wolf.db'));
db.pragma('journal_mode = WAL');

db.prepare(`CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  emoji TEXT,
  confidence INTEGER DEFAULT 0,
  change1 REAL DEFAULT 0,
  change5 REAL DEFAULT 0,
  change15 REAL DEFAULT 0,
  change30 REAL DEFAULT 0,
  price REAL DEFAULT 0,
  volume_spike INTEGER DEFAULT 0,
  volatility REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS scan_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_count INTEGER DEFAULT 0,
  signal_count INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

const defaults = {
  telegram_token:   '',
  telegram_chat_id: '',
  min_confidence:   '50',
  min_volume:       '10000000',
  coin_count:       '50',
  vol_spike_ratio:  '1.2',
  scan_interval:    '1',
};

for (const [key, value] of Object.entries(defaults)) {
  const ex = db.prepare('SELECT key FROM settings WHERE key=?').get(key);
  if (!ex) db.prepare('INSERT INTO settings (key,value) VALUES (?,?)').run(key, value);
}

module.exports = db;
