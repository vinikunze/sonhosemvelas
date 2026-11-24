import { json, erro } from '../../../_lib/util.js';
import { CHAVE_FOTO } from '../../../_lib/produto.js';

// DELETE /api/admin/fotos/:key : descarta foto enviada que não chegou a ser salva num produto
export async function onRequestDelete({ env, params }) {
  const key = String(params.key || '');
  if (!CHAVE_FOTO.test(key)) return erro('Foto inválida');
  const usada = await env.DB.prepare(
    `SELECT 1 FROM products WHERE images LIKE ?1
     UNION ALL SELECT 1 FROM settings WHERE hero_image = ?2 OR about_image = ?2 OR gallery LIKE ?1 LIMIT 1`,
  ).bind(`%"${key}"%`, key).first();
  if (usada) return json({ ok: true, mantida: true });
  await env.FOTOS.delete(key);
  return json({ ok: true });
}
