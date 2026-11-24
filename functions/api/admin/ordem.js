import { json, erro } from '../../_lib/util.js';

// PUT /api/admin/ordem : { tipo: 'produtos' | 'categorias' | 'destaques', ids: [...] } na nova ordem
export async function onRequestPut({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const alvo = {
    categorias: ['categories', 'position'],
    produtos: ['products', 'position'],
    destaques: ['products', 'featured_position'],
  }[b.tipo];
  if (!alvo || !Array.isArray(b.ids) || b.ids.length > 1000) return erro('Dados inválidos');
  const [tabela, coluna] = alvo;
  const stmts = b.ids.map((id, i) => env.DB.prepare(`UPDATE ${tabela} SET ${coluna} = ?1 WHERE id = ?2`).bind(i + 1, String(id)));
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}
