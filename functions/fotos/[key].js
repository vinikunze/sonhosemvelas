// GET /fotos/:key : entrega a foto guardada no KV (com cache na borda da Cloudflare)
export async function onRequestGet({ env, params, request, waitUntil }) {
  const key = String(params.key || '');
  if (!/^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i.test(key)) return new Response('Não encontrado', { status: 404 });

  const etag = `"${key}"`;
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { etag, 'cache-control': 'public, max-age=31536000, immutable' } });
  }

  // As chaves nunca são reaproveitadas, então a foto pode ficar em cache "para sempre"
  const cache = caches.default;
  const cacheKey = new Request(new URL(`/fotos/${key}`, request.url).toString());
  const emCache = await cache.match(cacheKey);
  if (emCache) return emCache;

  const { value, metadata } = await env.FOTOS.getWithMetadata(key, { type: 'arrayBuffer', cacheTtl: 86400 });
  if (!value) return new Response('Não encontrado', { status: 404 });

  const resp = new Response(value, {
    headers: {
      'content-type': metadata?.contentType || 'image/webp',
      'cache-control': 'public, max-age=31536000, immutable',
      etag,
    },
  });
  waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
