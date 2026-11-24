import { json, produtoDoBanco, SELECT_PRODUTO, ORDEM_PRODUTO } from '../../_lib/util.js';

// GET /api/admin/dados : tudo para o painel (inclui produtos escondidos)
export async function onRequestGet({ env }) {
  const [settings, categorias, produtos] = await env.DB.batch([
    env.DB.prepare('SELECT whatsapp, instagram, announcement, about FROM settings WHERE id = 1'),
    env.DB.prepare(
      `SELECT c.id, c.name, c.slug, c.position, COUNT(p.id) AS total
       FROM categories c LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id ORDER BY c.position, c.name`,
    ),
    env.DB.prepare(`${SELECT_PRODUTO} ${ORDEM_PRODUTO}`),
  ]);
  return json({
    settings: settings.results[0] || {},
    categorias: categorias.results,
    produtos: produtos.results.map(produtoDoBanco),
  });
}
