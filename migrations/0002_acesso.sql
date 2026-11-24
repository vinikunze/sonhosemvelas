-- Acesso ao painel guardado no banco (senha com PBKDF2, nunca em texto puro)
CREATE TABLE admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  session_secret TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
