import { json, erro } from '../../_lib/util.js';
import { criarCookie, iguais } from '../../_lib/sessao.js';

const MAX_TENTATIVAS = 8;
const JANELA_S = 15 * 60;

export async function onRequestPost({ request, env }) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const agora = Math.floor(Date.now() / 1000);

  const tent = await env.DB.prepare('SELECT count, first_at FROM login_attempts WHERE ip = ?1').bind(ip).first();
  if (tent && agora - tent.first_at < JANELA_S && tent.count >= MAX_TENTATIVAS) {
    const min = Math.ceil((JANELA_S - (agora - tent.first_at)) / 60);
    return erro(`Muitas tentativas. Tente de novo em ${min} minuto(s).`, 429);
  }

  let body = {};
  try { body = await request.json(); } catch { /* vazio */ }
  const senha = String(body.senha || '');

  if (senha && (await iguais(senha, env.ADMIN_PASSWORD, env.SESSION_SECRET))) {
    await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?1').bind(ip).run();
    return json({ ok: true }, 200, { 'set-cookie': await criarCookie(env, request) });
  }

  if (!tent || agora - tent.first_at >= JANELA_S) {
    await env.DB.prepare('INSERT OR REPLACE INTO login_attempts (ip, count, first_at) VALUES (?1, 1, ?2)').bind(ip, agora).run();
  } else {
    await env.DB.prepare('UPDATE login_attempts SET count = count + 1 WHERE ip = ?1').bind(ip).run();
  }
  return erro('Senha incorreta', 401);
}
