import { json, erro } from '../../_lib/util.js';
import { lerAdmin, conferirSenha, hashSenha, aleatorio, criarCookie, ITERACOES } from '../../_lib/sessao.js';

// PUT /api/admin/senha : { atual, nova } troca a senha do painel
export async function onRequestPut({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const atual = String(b.atual || '');
  const nova = String(b.nova || '');
  const admin = await lerAdmin(env);
  if (!(await conferirSenha(admin, atual))) return erro('A senha atual está incorreta');
  if (nova.length < 8) return erro('A nova senha precisa ter pelo menos 8 caracteres');
  if (nova.length > 200) return erro('Senha longa demais');

  const salt = aleatorio(16);
  const hash = await hashSenha(nova, salt, ITERACOES);
  const segredo = aleatorio(32);
  await env.DB.prepare(
    `UPDATE admin SET pass_hash = ?1, pass_salt = ?2, iterations = ?3, session_secret = ?4, updated_at = datetime('now') WHERE id = 1`,
  ).bind(hash, salt, ITERACOES, segredo).run();

  // Mantém este aparelho logado; os outros saem
  const novo = await lerAdmin(env);
  return json({ ok: true }, 200, { 'set-cookie': await criarCookie(novo, request) });
}
