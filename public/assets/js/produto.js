// Página de um produto: galeria, detalhes, pedido pelo WhatsApp e sugestões
import { esc, preco, precoInfo, precoHtml, linkWpp, fotoUrl, ilustracao, cardProduto, efeitos, ligarWpp, ligarInsta, mostrarAviso, toast } from './comum.js';

const main = document.getElementById('conteudo');
const barra = document.getElementById('barra-pedido');

efeitos();
ligarWpp();

const slug = window.__PRODUTO_SLUG__ || decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');

function mensagem(p, url) {
  const info = precoInfo(p);
  const valor = preco(info.final);
  if (!p.available) {
    return `Olá! Vi no catálogo que a *${p.name}* está esgotada. Pode me avisar quando voltar?\n\n${url}`;
  }
  return [
    'Olá! Vi no catálogo da Sonhos em Velas e quero fazer um pedido:',
    '',
    `*${p.name}*`,
    p.aroma ? `Aroma: ${p.aroma}` : null,
    p.size ? `Tamanho: ${p.size}` : null,
    valor ? `Valor: ${valor}${info.de ? ` (promoção, de ${preco(info.de)})` : ''}` : null,
    info.parcelas ? `Pagamento: ${info.parcelas.replace(/^ou /, '')}` : null,
    '',
    url,
  ].filter((l) => l !== null).join('\n');
}

function galeria(p) {
  const fotos = p.images.length ? p.images : [null];
  const slides = fotos
    .map((k, i) => (k
      ? `<img src="${fotoUrl(k)}" alt="${esc(p.name)}, foto ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" width="800" height="1000">`
      : ilustracao(p.slug)))
    .join('');
  const pontos = fotos.length > 1
    ? `<div class="galeria__pontos">${fotos.map((_, i) => `<button type="button" aria-label="Foto ${i + 1}" data-i="${i}" aria-current="${i === 0}"></button>`).join('')}</div>`
    : '';
  const minis = fotos.length > 1
    ? `<div class="galeria__miniaturas">${fotos.map((k, i) => `<button type="button" aria-label="Ver foto ${i + 1}" data-i="${i}" aria-current="${i === 0}"><img src="${fotoUrl(k)}" alt="" loading="lazy"></button>`).join('')}</div>`
    : '';
  return `<div class="galeria"><div class="galeria__trilho" id="trilho" tabindex="0" aria-label="Fotos do produto">${slides}</div>${pontos}${minis}</div>`;
}

function ligarGaleria() {
  const trilho = document.getElementById('trilho');
  if (!trilho) return;
  const botoes = document.querySelectorAll('.galeria [data-i]');
  const marcar = (i) => botoes.forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.i) === i)));
  botoes.forEach((b) => b.addEventListener('click', () => {
    trilho.scrollTo({ left: trilho.clientWidth * Number(b.dataset.i), behavior: 'smooth' });
  }));
  let t;
  trilho.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => marcar(Math.round(trilho.scrollLeft / trilho.clientWidth)), 60);
  }, { passive: true });
}

function schema(p, url) {
  const dados = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images.map((k) => location.origin + fotoUrl(k)),
    brand: { '@type': 'Brand', name: 'Sonhos em Velas' },
    url,
  };
  const final = precoInfo(p).final;
  if (final !== null && final !== undefined) {
    dados.offers = {
      '@type': 'Offer', priceCurrency: 'BRL', price: (final / 100).toFixed(2),
      availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    };
  }
  const s = document.createElement('script');
  s.type = 'application/ld+json';
  s.textContent = JSON.stringify(dados);
  document.head.append(s);
}

function render({ produto: p, settings: s, relacionados }) {
  const url = `${location.origin}/p/${p.slug}`;
  const valor = preco(precoInfo(p).final);
  const wpp = linkWpp(s.whatsapp, mensagem(p, url));
  const rotulo = p.available ? 'Pedir pelo WhatsApp' : 'Avise-me quando voltar';

  document.title = `${p.name} | Sonhos em Velas`;
  const ficha = [
    p.aroma && ['Aroma', p.aroma],
    p.size && ['Tamanho', p.size],
    p.category_name && ['Categoria', p.category_name],
  ].filter(Boolean);

  main.innerHTML = `
    <article class="produto">
      <nav class="migalha" aria-label="Você está em">
        <a href="/catalogo">Catálogo</a><span aria-hidden="true">/</span>
        ${p.category_slug ? `<a href="/catalogo?categoria=${encodeURIComponent(p.category_slug)}">${esc(p.category_name)}</a><span aria-hidden="true">/</span>` : ''}
        <span aria-current="page">${esc(p.name)}</span>
      </nav>
      <div class="produto__grid">
        ${galeria(p)}
        <div class="produto__info">
          ${p.category_name ? `<p class="produto__cat">${esc(p.category_name)}</p>` : ''}
          <h1>${esc(p.name)}</h1>
          ${precoHtml(p, 'produto__preco')}
          <p class="produto__status${p.available ? '' : ' produto__status--off'}">${p.available ? 'Disponível para pedido' : 'Esgotado no momento'}</p>
          ${ficha.length ? `<ul class="produto__ficha">${ficha.map(([k, v]) => `<li><span>${k}</span><strong>${esc(v)}</strong></li>`).join('')}</ul>` : '<div style="height:24px"></div>'}
          ${p.description ? `<p class="produto__desc">${esc(p.description)}</p>` : ''}
          <div class="produto__acoes" id="acoes">
            <a class="btn btn--wpp btn--bloco" href="${wpp}" target="_blank" rel="noopener">
              <svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-wpp"/></svg>${rotulo}
            </a>
            <button type="button" class="btn btn--fantasma btn--bloco" id="compartilhar">
              <svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-share"/></svg>Compartilhar
            </button>
          </div>
        </div>
      </div>
    </article>
    ${relacionados.length ? `
    <section class="relacionados" aria-labelledby="rel-titulo">
      <h2 id="rel-titulo">Você também pode gostar</h2>
      <div class="grade">${relacionados.map(cardProduto).join('')}</div>
    </section>` : ''}`;

  barra.innerHTML = `
    <div class="barra-pedido__info">
      <div class="barra-pedido__nome">${esc(p.name)}</div>
      <div class="barra-pedido__preco">${valor || 'Sob consulta'}</div>
    </div>
    <a class="btn btn--wpp" href="${wpp}" target="_blank" rel="noopener">
      <svg aria-hidden="true" viewBox="0 0 24 24"><use href="#i-wpp"/></svg>${p.available ? 'Pedir' : 'Avise-me'}
    </a>`;

  // Barra fixa de pedido aparece quando o botão principal sai da tela (celular)
  const acoes = document.getElementById('acoes');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      const mostrar = !e.isIntersecting && e.boundingClientRect.top < 0;
      barra.classList.toggle('is-visivel', mostrar);
      barra.setAttribute('aria-hidden', String(!mostrar));
    }).observe(acoes);
  }

  document.getElementById('compartilhar').addEventListener('click', async () => {
    const dados = { title: p.name, text: `${p.name} | Sonhos em Velas`, url };
    try {
      if (navigator.share) await navigator.share(dados);
      else { await navigator.clipboard.writeText(url); toast('Link copiado!'); }
    } catch { /* cancelado */ }
  });

  ligarGaleria();
  ligarWpp(s.whatsapp);
  ligarInsta(s.instagram);
  mostrarAviso(s.announcement);
  schema(p, url);
}

function naoEncontrado() {
  document.title = 'Produto não encontrado | Sonhos em Velas';
  main.innerHTML = `
    <div class="nao-encontrado">
      <h1>Produto não encontrado</h1>
      <p>Ele pode ter saído do catálogo. Que tal ver as outras velas?</p>
      <a class="btn" href="/catalogo">Ver catálogo</a>
    </div>`;
}

async function carregar() {
  if (!slug) return naoEncontrado();
  try {
    const r = await fetch(`/api/produtos/${encodeURIComponent(slug)}`);
    if (r.status === 404) return naoEncontrado();
    if (!r.ok) throw new Error(r.status);
    render(await r.json());
  } catch {
    main.innerHTML = '<div class="nao-encontrado"><h1>Ops!</h1><p>Não foi possível carregar o produto agora.</p><a class="btn" href="">Tentar de novo</a></div>';
  }
}

carregar();
