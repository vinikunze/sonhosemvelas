-- Sonhos em Velas: estrutura do catálogo

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER CHECK (price_cents IS NULL OR price_cents >= 0),
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  aroma TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  images TEXT NOT NULL DEFAULT '[]',
  available INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX products_list_idx ON products (visible, featured DESC, position, created_at DESC);
CREATE INDEX products_category_idx ON products (category_id);

CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  whatsapp TEXT NOT NULL DEFAULT '5566996359962',
  instagram TEXT NOT NULL DEFAULT 'sonhosemvelas_',
  announcement TEXT NOT NULL DEFAULT '',
  about TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Proteção contra tentativas repetidas de senha no painel
CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  first_at INTEGER NOT NULL
);

INSERT INTO settings (id, about) VALUES (
  1,
  'A Sonhos em Velas nasceu em Sinop, MT, com um propósito simples: transformar sonhos em velas. Cada peça é feita à mão, com aromas escolhidos com carinho para deixar a sua casa mais aconchegante e os seus presentes mais especiais.'
);

INSERT INTO categories (id, name, slug, position) VALUES
  ('cat-pote', 'Velas em pote', 'velas-em-pote', 1),
  ('cat-kits', 'Kits e presentes', 'kits-e-presentes', 2),
  ('cat-datas', 'Datas especiais', 'datas-especiais', 3);

-- Produtos de exemplo (apague ou edite pelo painel)
INSERT INTO products (id, name, slug, description, price_cents, category_id, aroma, size, featured, position) VALUES
  ('exemplo-1', 'Vela Lavanda Serena', 'vela-lavanda-serena', 'Produto de exemplo. Vela em pote de vidro com tampa, perfeita para relaxar no fim do dia.', 4990, 'cat-pote', 'Lavanda', '150 g', 1, 1),
  ('exemplo-2', 'Vela Baunilha e Canela', 'vela-baunilha-e-canela', 'Produto de exemplo. Aroma quentinho e aconchegante, ideal para a sala ou o quarto.', 4990, 'cat-pote', 'Baunilha e canela', '150 g', 0, 2),
  ('exemplo-3', 'Kit Presente Sonhos', 'kit-presente-sonhos', 'Produto de exemplo. Caixa com duas velas, cartão personalizado e laço. Pronto para presentear.', 11990, 'cat-kits', 'À sua escolha', '2 velas de 150 g', 1, 3),
  ('exemplo-4', 'Vela Natal em Família', 'vela-natal-em-familia', 'Produto de exemplo. Edição especial com notas de especiarias e frutas vermelhas.', NULL, 'cat-datas', 'Especiarias e frutas vermelhas', '200 g', 0, 4);
