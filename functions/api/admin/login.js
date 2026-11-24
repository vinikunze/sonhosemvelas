import { json, erro } from '../../_lib/util.js';
import { criarCookie, iguais, normalizarUsuario, lerAdmin, conferirSenha } from '../../_lib/sessao.js';

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

  const admin = await lerAdmin(env);
  if (!admin) return erro('Painel ainda não configurado.', 503);

  let body = {};
  try { body = await request.json(); } catch { /* vazio */ }
  const usuario = normalizarUsuario(body.usuario);
  const senha = String(body.senha || '');

  const [usuarioOk, senhaOk] = await Promise.all([
    iguais(usuario, normalizarUsuario(admin.username)),
    conferirSenha(admin, senha),
  ]);

  if (usuario && senha && usuarioOk && senhaOk) {
    await env.DB.prepare('DELETE FROM login_attempts WHERE ip = ?1').bind(ip).run();
    return json({ ok: true }, 200, { 'set-cookie': await criarCookie(admin, request) });
  }

  if (!tent || agora - tent.first_at >= JANELA_S) {
    await env.DB.prepare('INSERT OR REPLACE INTO login_attempts (ip, count, first_at) VALUES (?1, 1, ?2)').bind(ip, agora).run();
  } else {
    await env.DB.prepare('UPDATE login_attempts SET count = count + 1 WHERE ip = ?1').bind(ip).run();
  }
  return erro('Usuário ou senha incorretos', 401);
}
