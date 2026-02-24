import Database, { type Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

// Ensure data directory exists
import fs from 'fs';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'baby_growth.db');
const db: DatabaseType = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ---- Create tables ----
db.exec(`
  CREATE TABLE IF NOT EXISTS feeding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    breast_left INTEGER DEFAULT 0,
    breast_right INTEGER DEFAULT 0,
    bottle_breast_milk INTEGER DEFAULT 0,
    bottle_formula INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS diaper (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    type TEXT NOT NULL,
    color TEXT DEFAULT '',
    amount TEXT DEFAULT '',
    note TEXT DEFAULT '',
    image TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS supplement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    items TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sleep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT DEFAULT '',
    direction TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    content TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS care (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    items TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_note (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    date TEXT NOT NULL,
    temperature REAL DEFAULT 0,
    vaccine TEXT DEFAULT '',
    note TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_code TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    UNIQUE(family_code, key)
  );

  CREATE TABLE IF NOT EXISTS family (
    code TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_feeding_fc_date ON feeding(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_diaper_fc_date ON diaper(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_supplement_fc_date ON supplement(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_sleep_fc_date ON sleep(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_education_fc_date ON education(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_care_fc_date ON care(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_daily_note_fc_date ON daily_note(family_code, date);
  CREATE INDEX IF NOT EXISTS idx_settings_fc ON settings(family_code);
`);

export default db;
