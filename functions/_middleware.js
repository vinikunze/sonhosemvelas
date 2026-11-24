// Deixa o og:image da página inicial com endereço completo (exigido pelo WhatsApp/Facebook)
export async function onRequest({ request, next }) {
  const resp = await next();
  const url = new URL(request.url);
  if (url.pathname !== '/' || !(resp.headers.get('content-type') || '').includes('text/html')) return resp;
  return new HTMLRewriter()
    .on('meta[property="og:image"]', {
      element(el) {
        const v = el.getAttribute('content') || '';
        if (v.startsWith('/')) el.setAttribute('content', url.origin + v);
      },
    })
    .on('head', { element(el) { el.append(`<meta property="og:url" content="${url.origin}/">`, { html: true }); } })
    .transform(resp);
}
