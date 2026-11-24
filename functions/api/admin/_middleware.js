import { erro } from '../../_lib/util.js';
import { sessaoValida, lerAdmin } from '../../_lib/sessao.js';

const LIVRES = new Set(['/api/admin/login', '/api/admin/sessao']);

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Toda escrita precisa vir do próprio painel (cabeçalho extra força checagem do navegador)
  if (request.method !== 'GET' && request.headers.get('x-sev') !== '1') {
    return erro('Requisição inválida', 403);
  }

  if (!LIVRES.has(url.pathname)) {
    const admin = await lerAdmin(env);
    if (!admin) return erro('Painel ainda não configurado: defina o acesso com scripts/definir-acesso.mjs', 503);
    if (!(await sessaoValida(env, request, admin))) return erro('Faça login novamente', 401);
  }

  const resp = await next();
  const r = new Response(resp.body, resp);
  r.headers.set('cache-control', 'no-store');
  return r;
}
