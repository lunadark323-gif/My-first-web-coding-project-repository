CREATE TABLE IF NOT EXISTS bookings(
 id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires BIGINT NOT NULL, chat TEXT,
 form_hash TEXT UNIQUE, encrypted TEXT, status TEXT NOT NULL DEFAULT 'pending',
 consent_at TEXT, consent_version TEXT, created_seq BIGSERIAL UNIQUE
);
CREATE INDEX IF NOT EXISTS bookings_chat ON bookings(chat,created_seq DESC);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE IF NOT EXISTS admin_sessions(hash TEXT PRIMARY KEY,expires BIGINT NOT NULL,key_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bot_sessions(chat TEXT PRIMARY KEY,payload TEXT NOT NULL,updated BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS booking_contacts(booking_id TEXT PRIMARY KEY,contact TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS telegram_updates(id BIGINT PRIMARY KEY,processed_at TIMESTAMPTZ NOT NULL DEFAULT now());
