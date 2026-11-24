import { json, erro, lista } from '../../_lib/util.js';
import { CHAVE_FOTO, apagarFotos } from '../../_lib/produto.js';

// PUT /api/admin/midia : fotos do site { hero_image, about_image, gallery: [...] }
export async function onRequestPut({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const valida = (k) => (k && CHAVE_FOTO.test(String(k)) ? String(k) : '');
  const hero_image = valida(b.hero_image);
  const about_image = valida(b.about_image);
  const gallery = (Array.isArray(b.gallery) ? b.gallery : []).map(valida).filter(Boolean).slice(0, 16);

  const atual = await env.DB.prepare('SELECT hero_image, about_image, gallery FROM settings WHERE id = 1').first();
  await env.DB.prepare('UPDATE settings SET hero_image = ?1, about_image = ?2, gallery = ?3, updated_at = datetime(\'now\') WHERE id = 1')
    .bind(hero_image, about_image, JSON.stringify(gallery)).run();

  // Fotos que saíram do site e não estão em nenhum produto são apagadas
  const novas = new Set([hero_image, about_image, ...gallery]);
  const antigas = [atual?.hero_image, atual?.about_image, ...lista(atual?.gallery)].filter((k) => k && !novas.has(k));
  const soltas = [];
  for (const k of antigas) {
    const emProduto = await env.DB.prepare('SELECT 1 FROM products WHERE images LIKE ?1').bind(`%"${k}"%`).first();
    if (!emProduto) soltas.push(k);
  }
  await apagarFotos(env, soltas);
  return json({ ok: true });
}
