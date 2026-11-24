// GET /fotos/:key : entrega a foto guardada no R2
export async function onRequestGet({ env, params, request }) {
  const key = String(params.key || '');
  if (!/^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i.test(key)) return new Response('Não encontrado', { status: 404 });

  const obj = await env.FOTOS.get(key, { onlyIf: request.headers });
  if (!obj) return new Response('Não encontrado', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  // As chaves nunca são reaproveitadas, então a foto pode ficar em cache "para sempre"
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  if (!('body' in obj) || !obj.body) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
}
