import { json, erro, slugUnico, produtoDoBanco, SELECT_PRODUTO } from '../../../_lib/util.js';
import { lerProduto, apagarFotos } from '../../../_lib/produto.js';

async function buscar(env, id) {
  return env.DB.prepare('SELECT * FROM products WHERE id = ?1').bind(id).first();
}

// PUT /api/admin/produtos/:id : edita produto (fotos removidas são apagadas do R2)
export async function onRequestPut({ request, env, params }) {
  const atual = await buscar(env, params.id);
  if (!atual) return erro('Produto não encontrado', 404);
  const { dados, falha } = await lerProduto(request, env.DB);
  if (falha) return falha;

  const slug = dados.name === atual.name ? atual.slug : await slugUnico(env.DB, 'products', dados.name, atual.id);
  await env.DB.prepare(
    `UPDATE products SET name = ?2, slug = ?3, description = ?4, price_cents = ?5, category_id = ?6, aroma = ?7, size = ?8,
       images = ?9, available = ?10, featured = ?11, visible = ?12, updated_at = datetime('now')
     WHERE id = ?1`,
  ).bind(
    atual.id, dados.name, slug, dados.description, dados.price_cents, dados.category_id, dados.aroma, dados.size,
    JSON.stringify(dados.images), dados.available, dados.featured, dados.visible,
  ).run();

  let antigas = [];
  try { antigas = JSON.parse(atual.images || '[]'); } catch { /* ignora */ }
  await apagarFotos(env, antigas.filter((k) => !dados.images.includes(k)));

  const row = await env.DB.prepare(`${SELECT_PRODUTO} WHERE p.id = ?1`).bind(atual.id).first();
  return json({ produto: produtoDoBanco(row) });
}

// PATCH /api/admin/produtos/:id : liga/desliga rápido (disponível, destaque, visível)
export async function onRequestPatch({ request, env, params }) {
  const atual = await buscar(env, params.id);
  if (!atual) return erro('Produto não encontrado', 404);
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const campos = ['available', 'featured', 'visible'].filter((c) => typeof b[c] === 'boolean');
  if (!campos.length) return erro('Nada para alterar');
  const sets = campos.map((c, i) => `${c} = ?${i + 2}`).join(', ');
  await env.DB.prepare(`UPDATE products SET ${sets}, updated_at = datetime('now') WHERE id = ?1`)
    .bind(atual.id, ...campos.map((c) => (b[c] ? 1 : 0))).run();
  const row = await env.DB.prepare(`${SELECT_PRODUTO} WHERE p.id = ?1`).bind(atual.id).first();
  return json({ produto: produtoDoBanco(row) });
}

// DELETE /api/admin/produtos/:id : apaga produto e as fotos dele
export async function onRequestDelete({ env, params }) {
  const atual = await buscar(env, params.id);
  if (!atual) return erro('Produto não encontrado', 404);
  await env.DB.prepare('DELETE FROM products WHERE id = ?1').bind(atual.id).run();
  let fotos = [];
  try { fotos = JSON.parse(atual.images || '[]'); } catch { /* ignora */ }
  await apagarFotos(env, fotos);
  return json({ ok: true });
}
