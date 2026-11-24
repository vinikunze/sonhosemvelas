-- Loja completa: detalhes da vela, momentos de uso, pedido mínimo e fotos do site

ALTER TABLE products ADD COLUMN material TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN burn_time TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN occasions TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN min_qty INTEGER NOT NULL DEFAULT 1 CHECK (min_qty BETWEEN 1 AND 1000);

ALTER TABLE settings ADD COLUMN hero_image TEXT NOT NULL DEFAULT '';
ALTER TABLE settings ADD COLUMN about_image TEXT NOT NULL DEFAULT '';
ALTER TABLE settings ADD COLUMN gallery TEXT NOT NULL DEFAULT '[]';

-- Exemplos com os campos novos preenchidos (podem ser apagados no painel)
UPDATE products SET material = 'Cera vegetal, pavio de algodão e essência aromática.', burn_time = 'Cerca de 25 horas',
  occasions = '["Relaxar","Presente","Decoração"]' WHERE id = 'exemplo-1';
UPDATE products SET material = 'Cera vegetal, pavio de algodão e essência aromática.', burn_time = 'Cerca de 40 horas',
  occasions = '["Decoração","Presente"]' WHERE id = 'exemplo-2';
UPDATE products SET occasions = '["Presente","Aniversário","Datas especiais"]' WHERE id = 'exemplo-3';
UPDATE products SET occasions = '["Religioso","Presente"]' WHERE id = 'exemplo-4';
UPDATE products SET min_qty = 20, occasions = '["Lembrancinha","Casamento","Aniversário","Chá de bebê"]' WHERE id = 'exemplo-5';
