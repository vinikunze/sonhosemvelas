import { json } from '../../_lib/util.js';
import { sessaoValida } from '../../_lib/sessao.js';

// GET /api/admin/sessao : diz se o navegador já está logado
export async function onRequestGet({ request, env }) {
  return json({ logado: await sessaoValida(env, request) });
}
