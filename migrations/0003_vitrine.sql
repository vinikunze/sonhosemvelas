-- Catálogo como vitrine: promoção, parcelamento e destaques da página inicial

ALTER TABLE products ADD COLUMN promo_price_cents INTEGER CHECK (promo_price_cents IS NULL OR promo_price_cents >= 0);
ALTER TABLE products ADD COLUMN installments INTEGER NOT NULL DEFAULT 1 CHECK (installments BETWEEN 1 AND 12);
ALTER TABLE products ADD COLUMN interest_free INTEGER NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN featured_position INTEGER NOT NULL DEFAULT 0;

ALTER TABLE settings ADD COLUMN home_title TEXT NOT NULL DEFAULT 'Destaques da semana';
ALTER TABLE settings ADD COLUMN home_subtitle TEXT NOT NULL DEFAULT 'As velas escolhidas a dedo para esta semana.';

-- Categorias da loja (os produtos de exemplo passam a usá-las)
INSERT OR IGNORE INTO categories (id, name, slug, position) VALUES
  ('cat-gruta', 'Velas gruta', 'velas-gruta', 1),
  ('cat-lembranca', 'Lembrancinhas', 'lembrancinhas', 2),
  ('cat-pote-p', 'Potes pequenos', 'potes-pequenos', 3);
UPDATE categories SET name = 'Potes grandes', slug = 'potes-grandes', position = 4 WHERE id = 'cat-pote';
UPDATE categories SET position = 5 WHERE id = 'cat-kits';

UPDATE products SET category_id = 'cat-pote-p', name = 'Vela Lavanda Serena', description = 'Produto de exemplo. Pote pequeno de vidro com tampa, perfeito para relaxar no fim do dia.',
  price_cents = 3990, promo_price_cents = 2990, installments = 2, featured = 1, featured_position = 1 WHERE id = 'exemplo-1';
UPDATE products SET category_id = 'cat-pote', installments = 3, featured = 1, featured_position = 2 WHERE id = 'exemplo-2';
UPDATE products SET installments = 4, featured = 1, featured_position = 3 WHERE id = 'exemplo-3';
UPDATE products SET category_id = 'cat-gruta', name = 'Vela Gruta Nossa Senhora', slug = 'vela-gruta-nossa-senhora',
  description = 'Produto de exemplo. Vela em gruta decorativa, feita à mão.', aroma = 'Rosas', size = 'Gruta média',
  price_cents = 6990, installments = 3, featured = 0 WHERE id = 'exemplo-4';
INSERT OR IGNORE INTO products (id, name, slug, description, price_cents, category_id, aroma, size, installments, featured, featured_position, position) VALUES
  ('exemplo-5', 'Lembrancinha Mini Vela', 'lembrancinha-mini-vela', 'Produto de exemplo. Mini vela em latinha com tag personalizada, para chás, casamentos e aniversários. Valor por unidade.', 690, 'cat-lembranca', 'À escolha', 'Latinha 40 g', 1, 1, 4, 5);

-- A categoria "Datas especiais" sai se ficou sem produtos
DELETE FROM categories WHERE id = 'cat-datas' AND NOT EXISTS (SELECT 1 FROM products WHERE category_id = 'cat-datas');
