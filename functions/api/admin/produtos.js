import { json, novoId, slugUnico, produtoDoBanco, SELECT_PRODUTO } from '../../_lib/util.js';
import { lerProduto } from '../../_lib/produto.js';

// POST /api/admin/produtos : cria produto
export async function onRequestPost({ request, env }) {
  const { dados, falha } = await lerProduto(request, env.DB);
  if (falha) return falha;
  const id = novoId();
  const slug = await slugUnico(env.DB, 'products', dados.name);
  const min = await env.DB.prepare('SELECT COALESCE(MIN(position), 0) AS m FROM products').first();
  await env.DB.prepare(
    `INSERT INTO products (id, name, slug, description, price_cents, category_id, aroma, size, images, available, featured, visible, position)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
  ).bind(
    id, dados.name, slug, dados.description, dados.price_cents, dados.category_id, dados.aroma, dados.size,
    JSON.stringify(dados.images), dados.available, dados.featured, dados.visible, (min?.m ?? 0) - 1,
  ).run();
  const row = await env.DB.prepare(`${SELECT_PRODUTO} WHERE p.id = ?1`).bind(id).first();
  return json({ produto: produtoDoBanco(row) }, 201);
}
