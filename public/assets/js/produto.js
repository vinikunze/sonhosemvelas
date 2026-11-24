// Página da vela: galeria, preço, quantidade, sacola, detalhes e sugestões
import {
  montarCasca, aplicarAjustes, registrarProdutos, cardProduto, velaArte, fotoUrl, esc, preco, precoInfo, linkWpp, slug, ic,
  sacola, abrirSacola, toast, revelar, ligarCarrossel, pareceAdmin,
} from './comum.js';

montarCasca({ topoSolido: true });

const main = document.getElementById('conteudo');
const barra = document.getElementById('barra-compra');
const slugAtual = window.__PRODUTO_SLUG__ || decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');

const CUIDADOS = [
  'Na primeira vez, deixe a vela acesa até a cera derreter por toda a superfície (cerca de 2 horas). Isso evita que ela "afunde" no meio.',
  'Antes de acender de novo, apare o pavio para uns 5 mm. A chama fica mais bonita e sem fumaça.',
  'Não deixe a vela acesa sem ninguém por perto, nem perto de cortinas, crianças ou animais.',
  'Apague quando restar cerca de 1 cm de cera no fundo.',
];

function mensagem(p, qtd, url) {
  const i = precoInfo(p);
  return [
    p.available ? 'Olá! Vi no site da Sonhos em Velas e quero fazer um pedido:' : `Olá! Vi que a *${p.name}* está esgotada. Pode me avisar quando voltar?`,
    '',
    p.available && `• ${qtd}x *${p.name}*${p.size ? ` (${p.size})` : ''}`,
    p.available && p.aroma && `Aroma: ${p.aroma}`,
    p.available && i.final != null && `Valor: ${preco(i.final)} un.${qtd > 1 ? ` = ${preco(i.final * qtd)}` : ''}`,
    '',
    url,
  ].filter((l) => l !== false && l !== undefined && l !== null).join('\n');
}

function galeria(p) {
  const fotos = p.images.length ? p.images : [null];
  const slides = fotos.map((k, i) => (k
    ? `<img src="${fotoUrl(k)}" alt="${esc(p.name)}, foto ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async" width="800" height="1000">`
    : velaArte(p.slug, { texto: true }))).join('');
  const minis = fotos.length > 1
    ? `<div class="pp-galeria__minis">${fotos.map((k, i) => `<button type="button" data-i="${i}" aria-label="Foto ${i + 1}" aria-current="${i === 0}"><img src="${fotoUrl(k)}" alt=""></button>`).join('')}</div>`
    : '';
  return `<div class="pp-galeria">
    <div class="pp-galeria__trilho" id="trilho" tabindex="0" aria-label="Fotos">${slides}</div>
    ${minis}
    ${fotos.length > 1 ? `<span class="pp-galeria__contador" id="contador-foto">1 / ${fotos.length}</span>` : ''}
  </div>`;
}

function ligarGaleria(total) {
  const trilho = document.getElementById('trilho');
  if (!trilho || total < 2) return;
  const minis = document.querySelectorAll('.pp-galeria__minis button');
  const marcar = (i) => {
    minis.forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.i) === i)));
    const c = document.getElementById('contador-foto');
    if (c) c.textContent = `${i + 1} / ${total}`;
  };
  minis.forEach((b) => b.addEventListener('click', () => trilho.scrollTo({ left: trilho.clientWidth * Number(b.dataset.i), behavior: 'smooth' })));
  let t;
  trilho.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => marcar(Math.round(trilho.scrollLeft / trilho.clientWidth)), 60); }, { passive: true });
}

function blocoPreco(p) {
  const i = precoInfo(p);
  if (i.final === null || i.final === undefined) return '<div class="pp-preco"><span class="pp-preco__consulta">Valor sob consulta</span></div>';
  return `<div class="pp-preco${i.de ? ' pp-preco--promo' : ''}">
    <div class="pp-preco__linha">
      <span class="pp-preco__valor">${preco(i.final)}</span>
      ${i.de ? `<span class="pp-preco__de">${preco(i.de)}</span><span class="pp-preco__off">-${i.desconto}%</span>` : ''}
    </div>
    ${i.parcelas ? `<span class="pp-preco__parcelas">${i.parcelas}</span>` : ''}
  </div>`;
}

function render({ produto: p, settings: s, relacionados }) {
  registrarProdutos([p, ...relacionados]);
  aplicarAjustes(s);
  document.title = `${p.name} | Sonhos em Velas`;
  const url = `${location.origin}/p/${p.slug}`;
  const min = Math.max(1, p.min_qty || 1);
  let qtd = min;

  const fatos = [
    p.size && ['peso', 'Tamanho', p.size],
    p.aroma && ['aroma', 'Aroma', p.aroma],
    p.burn_time && ['relogio', 'Queima', p.burn_time],
    min > 1 && ['mini', 'Pedido mínimo', `${min} unidades`],
  ].filter(Boolean);

  const sanfona = [
    p.description && ['Sobre a vela', `<div class="sanfona__conteudo">${esc(p.description)}</div>`, true],
    p.material && ['Do que é feita', `<div class="sanfona__conteudo">${esc(p.material)}</div>`],
    p.occasions?.length && ['Ideal para', `<div class="sanfona__conteudo"><div class="etiquetas">${p.occasions.map((o) => `<a href="/catalogo?momento=${encodeURIComponent(slug(o))}">${esc(o)}</a>`).join('')}</div></div>`],
    ['Cuidados com a vela', `<div class="sanfona__conteudo"><ul>${CUIDADOS.map((c) => `<li>${c}</li>`).join('')}</ul></div>`],
    ['Entrega e pagamento', '<div class="sanfona__conteudo">Entregamos em Sinop e cidades da região, ou você pode retirar. Pagamento e prazo são combinados pelo WhatsApp ao finalizar o pedido.</div>'],
  ].filter(Boolean);

  main.innerHTML = `
    <div class="pp">
      <nav class="migalha" aria-label="Você está em">
        <a href="/catalogo">Catálogo</a><span aria-hidden="true">/</span>
        ${p.category_slug ? `<a href="/catalogo?categoria=${encodeURIComponent(p.category_slug)}">${esc(p.category_name)}</a>` : '<span>Velas</span>'}
      </nav>
      <div class="pp__grade">
        ${galeria(p)}
        <div class="pp-info">
          ${p.category_name ? `<span class="rotulo">${esc(p.category_name)}</span>` : ''}
          <h1>${esc(p.name)}</h1>
          ${blocoPreco(p)}
          ${fatos.length ? `<div class="pp-fatos">${fatos.map(([i, k, v]) => `<div>${ic(i)}<span><small>${k}</small><strong>${esc(v)}</strong></span></div>`).join('')}</div>` : '<div style="height:22px"></div>'}
          <p class="pp-status${p.available ? '' : ' pp-status--off'}">${p.available ? 'Disponível para pedido' : 'Esgotado no momento'}</p>
          ${p.available ? `
          <div class="pp-comprar">
            <div class="qtd qtd--grande" id="qtd">
              <button type="button" data-d="-1" aria-label="Diminuir">${ic('menos', '')}</button>
              <input type="number" inputmode="numeric" min="${min}" value="${min}" aria-label="Quantidade" id="qtd-n">
              <button type="button" data-d="1" aria-label="Aumentar">${ic('mais', '')}</button>
            </div>
            <button type="button" class="btn" id="adicionar">${ic('sacola')} Adicionar à sacola</button>
            <a class="btn btn--linha" id="comprar-wpp" href="#" target="_blank" rel="noopener">${ic('wpp')} Pedir só esta pelo WhatsApp</a>
          </div>` : `
          <div class="pp-comprar"><a class="btn btn--wpp" id="comprar-wpp" href="#" target="_blank" rel="noopener">${ic('wpp')} Avise-me quando voltar</a></div>`}
          <div class="sanfona">${sanfona.map(([t, c, aberto]) => `<details${aberto ? ' open' : ''}><summary>${t}</summary>${c}</details>`).join('')}</div>
          <div class="pp-compartilhar">
            <button type="button" class="chip-acao" id="compartilhar">${ic('compartilhar')} Compartilhar</button>
            ${pareceAdmin() ? `<a class="chip-acao" href="/admin#produto=${encodeURIComponent(p.id)}">Editar esta vela</a>` : ''}
          </div>
        </div>
      </div>
    </div>
    ${relacionados.length ? `
    <section class="relacionados" aria-labelledby="rel-titulo">
      <div class="carrossel-cab">
        <div class="secao__cab" style="margin:0"><span class="rotulo">Combina com</span><h2 id="rel-titulo" class="titulo-2">Você também<br><em>vai gostar.</em></h2></div>
        <div class="carrossel-nav"><button type="button" id="rel-ant" aria-label="Anterior">${ic('seta-esq')}</button><button type="button" id="rel-prox" aria-label="Próximo">${ic('seta')}</button></div>
      </div>
      <div class="carrossel" id="rel-trilho">${relacionados.map((r, i) => cardProduto(r, i)).join('')}</div>
    </section>` : ''}`;

  const wpp = document.getElementById('comprar-wpp');
  const atualizarWpp = () => { wpp.href = linkWpp(s.whatsapp, mensagem(p, qtd, url)); };
  atualizarWpp();

  if (p.available) {
    const campo = document.getElementById('qtd-n');
    const passo = min >= 10 ? 5 : 1;
    const definir = (n) => {
      qtd = Math.max(min, Math.min(9999, Number(n) || min));
      campo.value = qtd;
      document.querySelector('#qtd [data-d="-1"]').disabled = qtd <= min;
      atualizarWpp();
    };
    document.getElementById('qtd').addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]');
      if (b) definir(qtd + Number(b.dataset.d) * passo);
    });
    campo.addEventListener('change', () => definir(campo.value));
    definir(min);

    const adicionar = () => {
      sacola.adicionar(p, qtd);
      toast(`${qtd}x ${p.name} na sacola`, { rotulo: 'Ver sacola', fazer: abrirSacola });
    };
    document.getElementById('adicionar').addEventListener('click', adicionar);

    const info = precoInfo(p);
    barra.innerHTML = `
      <div class="barra-compra__info"><div class="barra-compra__nome">${esc(p.name)}</div><div class="barra-compra__preco">${info.final != null ? preco(info.final) : 'Sob consulta'}</div></div>
      <button type="button" class="btn" id="adicionar-barra">${ic('sacola')} Adicionar</button>`;
    document.getElementById('adicionar-barra').addEventListener('click', adicionar);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        const mostrar = !e.isIntersecting && e.boundingClientRect.top < 0;
        barra.classList.toggle('visivel', mostrar);
        barra.setAttribute('aria-hidden', String(!mostrar));
      }).observe(document.getElementById('adicionar'));
    }
  }

  document.getElementById('compartilhar').addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} | Sonhos em Velas`, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch { /* cancelado */ }
  });

  ligarGaleria(p.images.length);
  ligarCarrossel(document.getElementById('rel-trilho'), document.getElementById('rel-ant'), document.getElementById('rel-prox'));
  revelar();

  // Dados para o Google
  const final = precoInfo(p).final;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.description, image: p.images.map((k) => location.origin + fotoUrl(k)), brand: { '@type': 'Brand', name: 'Sonhos em Velas' }, url };
  if (final != null) ld.offers = { '@type': 'Offer', priceCurrency: 'BRL', price: (final / 100).toFixed(2), availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' };
  const sc = document.createElement('script');
  sc.type = 'application/ld+json';
  sc.textContent = JSON.stringify(ld);
  document.head.append(sc);
}

function naoEncontrado() {
  document.title = 'Vela não encontrada | Sonhos em Velas';
  main.innerHTML = `<div class="nao-achou"><span class="rotulo rotulo--centro">Ops</span><h1>Vela não encontrada</h1><p>Ela pode ter saído do catálogo. Que tal ver as outras?</p><a class="btn" href="/catalogo">Ver catálogo ${ic('seta', 'ic seta')}</a></div>`;
}

async function carregar() {
  if (!slugAtual) return naoEncontrado();
  try {
    const r = await fetch(`/api/produtos/${encodeURIComponent(slugAtual)}`);
    if (r.status === 404) return naoEncontrado();
    if (!r.ok) throw new Error(r.status);
    render(await r.json());
  } catch (err) {
    console.error(err);
    main.innerHTML = '<div class="nao-achou"><h1>Ops!</h1><p>Não foi possível carregar a vela agora.</p><a class="btn btn--linha" href="">Tentar de novo</a></div>';
  }
}

carregar();
