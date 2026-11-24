import { json, erro } from '../../_lib/util.js';

// PUT /api/admin/ordem : { tipo: 'produtos' | 'categorias', ids: [...] } na nova ordem
export async function onRequestPut({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const tabela = b.tipo === 'categorias' ? 'categories' : b.tipo === 'produtos' ? 'products' : null;
  if (!tabela || !Array.isArray(b.ids) || b.ids.length > 1000) return erro('Dados inválidos');
  const stmts = b.ids.map((id, i) => env.DB.prepare(`UPDATE ${tabela} SET position = ?1 WHERE id = ?2`).bind(i + 1, String(id)));
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}
