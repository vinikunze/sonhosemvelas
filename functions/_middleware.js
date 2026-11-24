// Deixa o og:image das páginas inicial e do catálogo com endereço completo (exigido pelo WhatsApp/Facebook)
export async function onRequest({ request, next }) {
  const resp = await next();
  const url = new URL(request.url);
  if (!['/', '/catalogo'].includes(url.pathname.replace(/\/$/, '') || '/') || !(resp.headers.get('content-type') || '').includes('text/html')) return resp;
  return new HTMLRewriter()
    .on('meta[property="og:image"]', {
      element(el) {
        const v = el.getAttribute('content') || '';
        if (v.startsWith('/')) el.setAttribute('content', url.origin + v);
      },
    })
    .on('head', { element(el) { el.append(`<meta property="og:url" content="${url.origin}${url.pathname}">`, { html: true }); } })
    .transform(resp);
}
