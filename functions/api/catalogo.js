import { json, ajustesDoBanco, produtoDoBanco, SELECT_PRODUTO, ORDEM_PRODUTO } from '../_lib/util.js';

// GET /api/catalogo : tudo que o site público precisa numa chamada só
export async function onRequestGet({ env }) {
  const [settings, categorias, produtos] = await env.DB.batch([
    env.DB.prepare('SELECT whatsapp, instagram, announcement, about, home_title, home_subtitle, hero_image, about_image, gallery FROM settings WHERE id = 1'),
    env.DB.prepare('SELECT id, name, slug FROM categories ORDER BY position, name'),
    env.DB.prepare(`${SELECT_PRODUTO} WHERE p.visible = 1 ${ORDEM_PRODUTO}`),
  ]);
  return json(
    {
      settings: ajustesDoBanco(settings.results[0]),
      categorias: categorias.results,
      produtos: produtos.results.map(produtoDoBanco),
    },
    200,
    { 'cache-control': 'public, max-age=30' },
  );
}
