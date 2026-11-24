import { json } from '../../_lib/util.js';
import { apagarCookie } from '../../_lib/sessao.js';

export async function onRequestPost({ request }) {
  return json({ ok: true }, 200, { 'set-cookie': apagarCookie(request) });
}
