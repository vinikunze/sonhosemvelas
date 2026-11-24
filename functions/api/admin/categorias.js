import { json, erro, novoId, slugUnico } from '../../_lib/util.js';

// POST /api/admin/categorias : cria categoria
export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const name = String(b.name || '').trim().slice(0, 60);
  if (!name) return erro('Dê um nome à categoria');
  const id = novoId();
  const slug = await slugUnico(env.DB, 'categories', name);
  const max = await env.DB.prepare('SELECT COALESCE(MAX(position), 0) AS m FROM categories').first();
  await env.DB.prepare('INSERT INTO categories (id, name, slug, position) VALUES (?1, ?2, ?3, ?4)')
    .bind(id, name, slug, (max?.m ?? 0) + 1).run();
  return json({ categoria: { id, name, slug, total: 0 } }, 201);
}
