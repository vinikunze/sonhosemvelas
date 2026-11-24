import { json, erro, produtoDoBanco, SELECT_PRODUTO, ORDEM_PRODUTO } from '../../_lib/util.js';

// GET /api/produtos/:slug : um produto + configurações + sugestões da mesma categoria
export async function onRequestGet({ env, params }) {
  const row = await env.DB.prepare(`${SELECT_PRODUTO} WHERE p.slug = ?1 AND p.visible = 1`).bind(params.slug).first();
  if (!row) return erro('Produto não encontrado', 404);
  const produto = produtoDoBanco(row);
  const [settings, relacionados] = await env.DB.batch([
    env.DB.prepare('SELECT whatsapp, instagram, announcement FROM settings WHERE id = 1'),
    env.DB.prepare(
      `${SELECT_PRODUTO} WHERE p.visible = 1 AND p.id != ?1
       ORDER BY (p.category_id IS ?2) DESC, p.featured DESC, p.position, p.created_at DESC LIMIT 8`,
    ).bind(produto.id, produto.category_id),
  ]);
  return json(
    { produto, settings: settings.results[0] || {}, relacionados: relacionados.results.map(produtoDoBanco) },
    200,
    { 'cache-control': 'public, max-age=30' },
  );
}
