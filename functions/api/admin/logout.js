import { json } from '../../_lib/util.js';
import { apagarCookie, cookieDica } from '../../_lib/sessao.js';

export async function onRequestPost({ request }) {
  const resp = json({ ok: true });
  resp.headers.append('set-cookie', apagarCookie(request));
  resp.headers.append('set-cookie', cookieDica(request, false));
  return resp;
}
