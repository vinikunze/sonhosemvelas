import { json, erro, slugUnico } from '../../../_lib/util.js';

// PUT /api/admin/categorias/:id : renomeia
export async function onRequestPut({ request, env, params }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const name = String(b.name || '').trim().slice(0, 60);
  if (!name) return erro('Dê um nome à categoria');
  const atual = await env.DB.prepare('SELECT id FROM categories WHERE id = ?1').bind(params.id).first();
  if (!atual) return erro('Categoria não encontrada', 404);
  const slug = await slugUnico(env.DB, 'categories', name, atual.id);
  await env.DB.prepare('UPDATE categories SET name = ?2, slug = ?3 WHERE id = ?1').bind(atual.id, name, slug).run();
  return json({ ok: true });
}

// DELETE /api/admin/categorias/:id : apaga (os produtos ficam "sem categoria")
export async function onRequestDelete({ env, params }) {
  await env.DB.batch([
    env.DB.prepare('UPDATE products SET category_id = NULL WHERE category_id = ?1').bind(params.id),
    env.DB.prepare('DELETE FROM categories WHERE id = ?1').bind(params.id),
  ]);
  return json({ ok: true });
}
