import { escapeHtml, produtoDoBanco, SELECT_PRODUTO } from '../_lib/util.js';

function preco(c) {
  if (c === null || c === undefined) return 'Sob consulta';
  return (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// /p/:slug : página do produto, com título e imagem certos para a prévia do link no WhatsApp/Instagram
export async function onRequestGet({ request, env, params }) {
  const url = new URL(request.url);
  const pagina = await env.ASSETS.fetch(new URL('/produto', url.origin));

  const row = await env.DB.prepare(`${SELECT_PRODUTO} WHERE p.slug = ?1 AND p.visible = 1`).bind(params.slug).first();
  if (!row) return new Response(pagina.body, { status: 404, headers: pagina.headers });

  const p = produtoDoBanco(row);
  const titulo = `${p.name} | Sonhos em Velas`;
  const precoFinal = p.promo_price_cents ?? p.price_cents;
  const desc = [p.promo_price_cents != null ? `De ${preco(p.price_cents)} por ${preco(precoFinal)}` : preco(precoFinal), p.aroma && `Aroma: ${p.aroma}`, p.description].filter(Boolean).join(' · ').slice(0, 200);
  const imagem = p.images[0] ? `${url.origin}/fotos/${p.images[0]}` : `${url.origin}/assets/img/og.jpg`;
  const canonical = `${url.origin}/p/${p.slug}`;

  const meta = (attr, nome, valor) => `<meta ${attr}="${nome}" content="${escapeHtml(valor)}">`;
  const extras = [
    meta('property', 'og:type', 'product'),
    meta('property', 'og:title', titulo),
    meta('property', 'og:description', desc),
    meta('property', 'og:image', imagem),
    meta('property', 'og:url', canonical),
    meta('name', 'twitter:card', 'summary_large_image'),
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<script>window.__PRODUTO_SLUG__=${JSON.stringify(p.slug)}</script>`,
  ].join('');

  const resp = new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(titulo); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', desc); } })
    .on('meta[property^="og:"]', { element(el) { el.remove(); } })
    .on('head', { element(el) { el.append(extras, { html: true }); } })
    .transform(pagina);

  const headers = new Headers(resp.headers);
  headers.set('cache-control', 'public, max-age=60');
  return new Response(resp.body, { status: 200, headers });
}
