// Sonhos em Velas : peças compartilhadas pelo site (menu, sacola, cards, preços, ícones)

export const WPP_PADRAO = '5566996359962';
let ajustes = { whatsapp: localStorage.getItem('sev_wpp') || WPP_PADRAO };

/* ============ Utilidades ============ */

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
export function preco(cents) {
  if (cents === null || cents === undefined) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
export function normalizar(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
export function slug(s) {
  return normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function fotoUrl(key) {
  return `/fotos/${encodeURIComponent(key)}`;
}
export function linkWpp(numero, mensagem) {
  const n = String(numero || ajustes.whatsapp || WPP_PADRAO).replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(mensagem)}`;
}
export function telefoneBonito(numero) {
  const d = String(numero || WPP_PADRAO).replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
export function pareceAdmin() {
  return /(?:^|;\s*)sev_adm=1/.test(document.cookie);
}
export const ic = (nome, classe = 'ic') => `<svg class="${classe}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

/* ============ Preço ============ */

export function precoInfo(p) {
  const temPromo = p.promo_price_cents !== null && p.promo_price_cents !== undefined && p.price_cents !== null && p.promo_price_cents < p.price_cents;
  const final = temPromo ? p.promo_price_cents : p.price_cents;
  const n = Math.max(1, Number(p.installments) || 1);
  let parcelas = '';
  if (final !== null && final !== undefined && n > 1) {
    parcelas = p.interest_free === false ? `em até ${n}x no cartão` : `ou ${n}x de ${preco(Math.ceil(final / n))} sem juros`;
  }
  return {
    final,
    de: temPromo ? p.price_cents : null,
    desconto: temPromo ? Math.round((1 - p.promo_price_cents / p.price_cents) * 100) : 0,
    parcelas,
  };
}

export function precoLinha(p) {
  const i = precoInfo(p);
  if (i.final === null || i.final === undefined) return '<div class="preco-linha"><span class="preco-linha__consulta">Sob consulta</span></div>';
  return `<div class="preco-linha${i.de ? ' preco-linha--promo' : ''}">
    <span class="preco-linha__valor">${preco(i.final)}</span>
    ${i.de ? `<span class="preco-linha__de">${preco(i.de)}</span>` : ''}
    ${i.parcelas ? `<span class="preco-linha__parcelas">${i.parcelas}</span>` : ''}
  </div>`;
}

/* ============ Arte da vela (enquanto não há foto) ============ */

const TONS = [
  { fundo: ['#FBE6F0', '#F3D3E4'], cera: ['#FFF4F8', '#F4B9D2'] },
  { fundo: ['#EEE5F8', '#DCCDF0'], cera: ['#FAF6FF', '#C9B3EA'] },
  { fundo: ['#FFF0E6', '#FADCC9'], cera: ['#FFFAF4', '#F7C9A7'] },
  { fundo: ['#F5EDF3', '#E9DAE6'], cera: ['#FFFDFB', '#E7CFDD'] },
];
let idArte = 0;
export function velaArte(seed = '', { texto = false, rotulo = true, fundo = true } = {}) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const t = TONS[h % TONS.length];
  const id = `va${++idArte}`;
  return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Foto em breve">
    <defs>
      <radialGradient id="${id}f" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${t.fundo[0]}"/><stop offset="1" stop-color="${t.fundo[1]}"/></radialGradient>
      <radialGradient id="${id}h" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE3B0" stop-opacity=".9"/><stop offset=".5" stop-color="#FFB8D0" stop-opacity=".25"/><stop offset="1" stop-color="#FF9FB8" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.cera[0]}"/><stop offset="1" stop-color="${t.cera[1]}"/></linearGradient>
      <linearGradient id="${id}l" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFF8E8"/><stop offset=".4" stop-color="#FFD58A"/><stop offset="1" stop-color="#FF9F5A" stop-opacity=".85"/></linearGradient>
      <linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".3" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".6"/></linearGradient>
    </defs>
    ${fundo ? `<rect width="400" height="500" fill="url(#${id}f)"/>` : ''}
    <circle class="halo" cx="200" cy="200" r="170" fill="url(#${id}h)"/>
    <ellipse cx="200" cy="420" rx="110" ry="11" fill="#6F4FA0" opacity=".12"/>
    <rect x="122" y="226" width="156" height="190" rx="22" fill="url(#${id}v)" stroke="rgba(111,79,160,.28)" stroke-width="1.5"/>
    <path d="M131 268 Q200 256 269 268 L269 392 Q269 406 255 406 L145 406 Q131 406 131 392 Z" fill="url(#${id}c)"/>
    <ellipse cx="200" cy="266" rx="69" ry="9" fill="#fff" opacity=".55"/>
    ${rotulo ? `<rect x="158" y="312" width="84" height="46" rx="4" fill="#FBF5EE" opacity=".93"/><text x="200" y="332" text-anchor="middle" font-family="Cormorant Garamond, serif" font-style="italic" font-size="13" fill="#7A2E4E">Sonhos</text><text x="200" y="348" text-anchor="middle" font-family="Cormorant Garamond, serif" font-style="italic" font-size="13" fill="#7A2E4E">em Velas</text>` : ''}
    <line x1="200" y1="266" x2="200" y2="244" stroke="#4A3558" stroke-width="2.5" stroke-linecap="round"/>
    <g class="chama"><path d="M200 172 C217 198 219 220 210 234 C205 242 195 242 190 234 C181 220 184 198 200 172 Z" fill="url(#${id}l)"/><path d="M200 206 C206 216 206 226 202 232 C200 235 198 235 197 232 C194 226 195 216 200 206 Z" fill="#FFFDF6"/></g>
    <path d="M140 244 L140 390" stroke="rgba(255,255,255,.9)" stroke-width="3" stroke-linecap="round"/>
    ${texto ? '<text x="200" y="468" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11" letter-spacing="4" fill="rgba(111,79,160,.45)">FOTO EM BREVE</text>' : ''}
  </svg>`;
}
// Mantido para o PDF
export const ilustracao = (seed) => velaArte(seed, { texto: true });

/* ============ Registro de produtos (para a sacola e o "+" rápido) ============ */

const registro = new Map();
export function registrarProdutos(lista) {
  for (const p of lista) registro.set(p.id, p);
  sacola.sincronizar(lista);
}

/* ============ Card de produto ============ */

export function cardProduto(p, i = 0, { admin = false } = {}) {
  registro.set(p.id, p);
  const info = precoInfo(p);
  const url = `/p/${encodeURIComponent(p.slug)}`;
  const foto = p.images[0]
    ? `<img src="${fotoUrl(p.images[0])}" alt="${esc(p.name)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="400" height="500">
       ${p.images[1] ? `<img class="segunda" src="${fotoUrl(p.images[1])}" alt="" loading="lazy" decoding="async">` : ''}`
    : velaArte(p.slug);
  const selos = [
    !p.available && '<span class="selo">Esgotado</span>',
    p.available && info.desconto && `<span class="selo selo--promo">-${info.desconto}%</span>`,
    p.available && p.featured && !info.desconto && '<span class="selo selo--ouro">Destaque</span>',
  ].filter(Boolean).join('');
  const meta = [p.size, p.aroma].filter(Boolean).join(' · ');
  return `<article class="produto-card${p.available ? '' : ' produto-card--esgotado'}">
    <a class="produto-card__foto" href="${url}" tabindex="-1" aria-hidden="true">
      ${selos ? `<div class="selos">${selos}</div>` : ''}
      ${foto}
    </a>
    ${p.available ? `<button type="button" class="add-rapido" data-add="${esc(p.id)}" aria-label="Adicionar ${esc(p.name)} à sacola">${ic('mais', '')}</button>` : ''}
    ${admin ? `<a class="editar-adm" href="/admin#produto=${encodeURIComponent(p.id)}">Editar</a>` : ''}
    <div class="produto-card__corpo">
      ${p.category_name ? `<span class="produto-card__cat">${esc(p.category_name)}</span>` : ''}
      <a class="produto-card__nome" href="${url}">${esc(p.name)}</a>
      ${meta ? `<span class="produto-card__meta">${esc(meta)}</span>` : ''}
      ${precoLinha(p)}
      ${p.min_qty > 1 ? `<span class="produto-card__min">Pedido mínimo: ${p.min_qty} un.</span>` : ''}
    </div>
  </article>`;
}

/* ============ Sacola ============ */

const CHAVE = 'sev_sacola';
export const sacola = {
  itens: (() => { try { return JSON.parse(localStorage.getItem(CHAVE) || '[]'); } catch { return []; } })(),
  salvar() {
    localStorage.setItem(CHAVE, JSON.stringify(this.itens));
    atualizarContador();
    renderSacola();
  },
  adicionar(p, qtd) {
    const min = Math.max(1, p.min_qty || 1);
    const existente = this.itens.find((x) => x.id === p.id);
    if (existente) existente.qtd += qtd || 1;
    else {
      this.itens.push({
        id: p.id, slug: p.slug, nome: p.name, foto: p.images[0] || '', preco: precoInfo(p).final ?? null,
        detalhe: [p.size, p.aroma].filter(Boolean).join(' · '), min, qtd: Math.max(min, qtd || min),
      });
    }
    this.salvar();
    pularContador();
  },
  mudar(id, qtd) {
    const it = this.itens.find((x) => x.id === id);
    if (!it) return;
    it.qtd = Math.max(it.min || 1, Math.min(9999, qtd));
    this.salvar();
  },
  tirar(id) {
    this.itens = this.itens.filter((x) => x.id !== id);
    this.salvar();
  },
  quantidade() { return this.itens.reduce((s, x) => s + x.qtd, 0); },
  total() { return this.itens.reduce((s, x) => s + (x.preco ?? 0) * x.qtd, 0); },
  temConsulta() { return this.itens.some((x) => x.preco === null); },
  // Atualiza nomes e preços com os dados mais novos do catálogo
  sincronizar(lista) {
    let mudou = false;
    for (const it of this.itens) {
      const p = lista.find((x) => x.id === it.id);
      if (!p) continue;
      const novo = { nome: p.name, slug: p.slug, foto: p.images[0] || '', preco: precoInfo(p).final ?? null, min: Math.max(1, p.min_qty || 1), detalhe: [p.size, p.aroma].filter(Boolean).join(' · ') };
      for (const k of Object.keys(novo)) if (it[k] !== novo[k]) { it[k] = novo[k]; mudou = true; }
      if (it.qtd < it.min) { it.qtd = it.min; mudou = true; }
    }
    if (mudou) this.salvar();
  },
};

function atualizarContador() {
  const n = sacola.quantidade();
  document.querySelectorAll('.contador').forEach((c) => {
    c.textContent = n > 99 ? '99+' : String(n);
    c.classList.toggle('tem', n > 0);
  });
}
function pularContador() {
  document.querySelectorAll('.contador').forEach((c) => { c.classList.remove('pulo'); void c.offsetWidth; c.classList.add('pulo'); });
}

function renderSacola() {
  const corpo = document.getElementById('sacola-corpo');
  const rodape = document.getElementById('sacola-rodape');
  if (!corpo) return;
  const n = sacola.quantidade();
  document.getElementById('sacola-qtd').textContent = n ? `${n} ${n === 1 ? 'item' : 'itens'}` : '';
  if (!sacola.itens.length) {
    corpo.innerHTML = `<div class="sacola-vazia">
      <div class="vela-mini">${velaArte('vazia', { rotulo: false })}</div>
      <h3>Sua sacola está vazia</h3>
      <p>Escolha suas velas no catálogo e monte seu pedido.</p>
      <a class="btn btn--linha" href="/catalogo" style="margin-top:22px">Ver catálogo ${ic('seta', 'ic seta')}</a>
    </div>`;
    rodape.hidden = true;
    return;
  }
  rodape.hidden = false;
  corpo.innerHTML = sacola.itens.map((it) => `
    <div class="sacola-item">
      <a class="sacola-item__foto" href="/p/${encodeURIComponent(it.slug)}">${it.foto ? `<img src="${fotoUrl(it.foto)}" alt="">` : velaArte(it.slug, { rotulo: false })}</a>
      <div>
        <a class="sacola-item__nome" href="/p/${encodeURIComponent(it.slug)}">${esc(it.nome)}</a>
        ${it.detalhe ? `<div class="sacola-item__meta">${esc(it.detalhe)}</div>` : ''}
        ${it.min > 1 ? `<div class="sacola-item__meta">Mínimo ${it.min} un.</div>` : ''}
        <div class="qtd" data-qtd="${esc(it.id)}">
          <button type="button" data-delta="-1" aria-label="Diminuir" ${it.qtd <= (it.min || 1) ? 'disabled' : ''}>${ic('menos', '')}</button>
          <span aria-live="polite">${it.qtd}</span>
          <button type="button" data-delta="1" aria-label="Aumentar">${ic('mais', '')}</button>
        </div>
      </div>
      <div>
        <div class="sacola-item__preco">${it.preco === null ? 'A combinar' : preco(it.preco * it.qtd)}</div>
        <button type="button" class="sacola-item__tirar" data-tirar="${esc(it.id)}">Remover</button>
      </div>
    </div>`).join('');
  document.getElementById('sacola-total').textContent = preco(sacola.total());
  document.getElementById('sacola-nota').textContent = sacola.temConsulta()
    ? 'Itens "a combinar" têm o valor confirmado pelo WhatsApp.'
    : 'Entrega e forma de pagamento combinadas pelo WhatsApp.';
}

function mensagemPedido(form) {
  const dados = new FormData(form);
  const nome = String(dados.get('nome') || '').trim();
  const entrega = String(dados.get('entrega') || '');
  const obs = String(dados.get('obs') || '').trim();
  const linhas = sacola.itens.map((it) =>
    `• ${it.qtd}x *${it.nome}*${it.detalhe ? ` (${it.detalhe})` : ''}${it.preco === null ? ' - valor a combinar' : ` - ${preco(it.preco)} un. = ${preco(it.preco * it.qtd)}`}`);
  const extras = [nome && `Nome: ${nome}`, entrega && `Receber: ${entrega}`, obs && `Observação: ${obs}`].filter(Boolean);
  return [
    'Olá! Quero fazer este pedido pelo site da *Sonhos em Velas*:',
    '',
    ...linhas,
    '',
    `*Total: ${preco(sacola.total())}*${sacola.temConsulta() ? ' + itens a combinar' : ''}`,
    ...(extras.length ? ['', ...extras] : []),
  ].join('\n');
}

export function abrirSacola() {
  renderSacola();
  document.getElementById('gaveta').classList.add('aberta');
  document.getElementById('veu').classList.add('aberto');
  document.body.classList.add('travado');
}
export function fecharGavetas() {
  document.querySelectorAll('.gaveta.aberta, .folha.aberta').forEach((g) => g.classList.remove('aberta'));
  document.getElementById('veu')?.classList.remove('aberto');
  document.body.classList.remove('travado');
}

/* ============ Toast ============ */

export function toast(msg, acao) {
  const t = document.getElementById('toast');
  t.innerHTML = `<span>${esc(msg)}</span>${acao ? `<button type="button">${esc(acao.rotulo)}</button>` : ''}`;
  if (acao) t.querySelector('button').onclick = () => { t.classList.remove('visivel'); acao.fazer(); };
  t.classList.add('visivel');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visivel'), acao ? 3800 : 2400);
}

/* ============ Ícones ============ */

const ICONES = {
  wpp: '<path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24a8.2 8.2 0 0 1 8.23 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28Z"/>',
  insta: '<g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.3" cy="6.7" r="1" fill="currentColor"/>',
  sacola: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  fechar: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/>',
  seta: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M4 12h15m-5-5 5 5-5 5"/>',
  'seta-esq': '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M20 12H5m5-5-5 5 5 5"/>',
  'seta-diag': '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M9 7h8v8"/>',
  mais: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 5v14M5 12h14"/>',
  menos: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M5 12h14"/>',
  busca: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="m20 20-3.5-3.5"/></g>',
  filtro: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M4 7h10M18 7h2M4 17h4M12 17h8"/><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></g>',
  pdf: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
  link: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  chama: '<path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" d="M12 2.5c3 4 4.5 6.7 4.5 9.4a4.5 4.5 0 0 1-9 0c0-1.6.6-3 1.7-4.4.3 1.3 1 2.2 2 2.6-.4-2.6-.1-5 .8-7.6Z"/><path fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" d="M8 21.5h8"/>',
  pote: '<g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><rect x="6" y="9" width="12" height="12" rx="2"/><path d="M6 12.5h12M12 9V6.5"/><path d="M12 2.5c1 1.2 1.4 2 1 3-.3.6-1.7.6-2 0-.4-1 0-1.8 1-3Z"/></g>',
  gruta: '<g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M4 21V11a8 8 0 0 1 16 0v10Z"/><path d="M8 21v-7a4 4 0 0 1 8 0v7"/><path d="M12 9c.8 1 1 1.6.8 2.3-.2.4-1.4.4-1.6 0-.2-.7 0-1.3.8-2.3Z"/></g>',
  presente: '<g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9ZM3 7h18v4H3zM12 7v14"/><path d="M12 7c-1.5-3-5-3.5-5-1.5S10 7 12 7Zm0 0c1.5-3 5-3.5 5-1.5S14 7 12 7Z"/></g>',
  mini: '<g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><rect x="3" y="13" width="7" height="8" rx="1.5"/><rect x="14" y="13" width="7" height="8" rx="1.5"/><path d="M6.5 13v-2M17.5 13v-2"/><path d="M6.5 7.5c.7.9.9 1.5.6 2-.2.3-1 .3-1.2 0-.3-.5-.1-1.1.6-2ZM17.5 7.5c.7.9.9 1.5.6 2-.2.3-1 .3-1.2 0-.3-.5-.1-1.1.6-2Z"/></g>',
  peso: '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M6 8h12l2 12H4L6 8Z"/><circle cx="12" cy="5.5" r="2.2"/></g>',
  relogio: '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>',
  folha: '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 7-7"/>',
  aroma: '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" d="M8 20c-2-3 2-5 0-8s2-5 0-8M13 20c-2-3 2-5 0-8s2-5 0-8M18 20c-2-3 2-5 0-8s2-5 0-8"/>',
  caminhao: '<g fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></g>',
  mao: '<path fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" d="M3 15.5c2.4-1.2 4.4-1.4 6.2-.6l3.6 1.5c.9.4 1.3 1.4.9 2.2-.3.7-1.1 1-1.8.8L9 18.6M3 20.5l3.4-1.2c1.2-.4 2.4-.4 3.6 0l2.6.9c1.3.4 2.7.2 3.8-.6l4.7-3.6c.7-.5.8-1.5.2-2.2-.5-.6-1.4-.7-2-.2l-3.4 2.3M10 4.5c1 1.2 1.2 2.3.6 3.3-.4.6-1.3.6-1.7 0-.6-1 .1-2.2 1.1-3.3ZM9.7 9.5v3"/>',
  local: '<g fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></g>',
  compartilhar: '<path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  check: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m5 12.5 4.5 4.5L19 7.5"/>',
};

/* ============ Casca: menu, sacola, toast, flutuante ============ */

const MENU = [
  ['/', 'Início'],
  ['/catalogo', 'Catálogo'],
  ['/#colecoes', 'Coleções'],
  ['/#momentos', 'Momentos'],
  ['/#essencia', 'Nossa história'],
  ['/#contato', 'Contato'],
];

export function montarCasca({ topoSolido = false } = {}) {
  document.documentElement.classList.add('js');

  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICONES)
    .map(([n, d]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${d}</symbol>`).join('')}</svg>`;

  const menu = `<div class="menu-tela" id="menu-tela" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="menu-tela__topo">
      <a class="marca" href="/"><img src="/assets/img/logo.png" alt="" width="38" height="38"><span>Sonhos em Velas</span></a>
      <button type="button" class="btn-icone" data-fechar-menu aria-label="Fechar menu">${ic('fechar')}</button>
    </div>
    <nav aria-label="Menu">${MENU.map(([h, t], i) => `<a href="${h}"><span class="num">0${i + 1}</span>${t}</a>`).join('')}</nav>
    <div class="menu-tela__rodape">
      <a class="btn" href="/catalogo">Ver catálogo ${ic('seta', 'ic seta')}</a>
      <a class="btn btn--linha js-wpp" href="#" data-msg="Olá! Vim pelo site da Sonhos em Velas.">${ic('wpp')} Falar no WhatsApp</a>
      <p>Velas artesanais · Sinop, MT</p>
    </div>
  </div>`;

  const gaveta = `<div class="veu" id="veu"></div>
  <aside class="gaveta" id="gaveta" aria-label="Sacola" role="dialog" aria-modal="true">
    <div class="gaveta__cab">
      <h2>Sacola <small id="sacola-qtd"></small></h2>
      <button type="button" class="btn-icone" data-fechar aria-label="Fechar sacola">${ic('fechar')}</button>
    </div>
    <div class="gaveta__corpo" id="sacola-corpo"></div>
    <form class="gaveta__rodape" id="sacola-rodape" hidden>
      <div class="total"><span>Total</span><strong id="sacola-total"></strong></div>
      <p class="total-nota" id="sacola-nota"></p>
      <details class="detalhes-pedido">
        <summary><span>Adicionar nome e entrega (opcional)</span><span aria-hidden="true">+</span></summary>
        <div>
          <div class="campo-sacola"><label for="sac-nome">Seu nome</label><input id="sac-nome" name="nome" autocomplete="name" maxlength="80"></div>
          <div class="campo-sacola"><span>Como prefere receber</span>
            <div class="opcoes">
              <label><input type="radio" name="entrega" value="Entrega"><span>Entrega</span></label>
              <label><input type="radio" name="entrega" value="Retirada"><span>Retirada</span></label>
            </div>
          </div>
          <div class="campo-sacola"><label for="sac-obs">Observação</label><textarea id="sac-obs" name="obs" rows="2" maxlength="400" placeholder="Ex.: aromas, data da festa, cor da fita..."></textarea></div>
        </div>
      </details>
      <button class="btn btn--wpp btn--bloco" type="submit">${ic('wpp')} Finalizar pelo WhatsApp</button>
    </form>
  </aside>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <a class="flutuante js-wpp" href="#" data-msg="Olá! Vim pelo site da Sonhos em Velas." aria-label="Pedir pelo WhatsApp">${ic('wpp')} Pedir</a>`;

  document.body.insertAdjacentHTML('afterbegin', sprite);
  document.body.insertAdjacentHTML('beforeend', menu + gaveta);

  // Menu
  const tela = document.getElementById('menu-tela');
  const abrirMenu = () => { tela.classList.add('aberto'); document.body.classList.add('travado'); };
  const fecharMenu = () => { tela.classList.remove('aberto'); document.body.classList.remove('travado'); };
  document.querySelectorAll('[data-abrir-menu]').forEach((b) => b.addEventListener('click', abrirMenu));
  tela.querySelector('[data-fechar-menu]').addEventListener('click', fecharMenu);
  tela.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', fecharMenu));

  // Sacola
  document.querySelectorAll('[data-abrir-sacola]').forEach((b) => b.addEventListener('click', abrirSacola));
  document.getElementById('veu').addEventListener('click', fecharGavetas);
  document.querySelector('#gaveta [data-fechar]').addEventListener('click', fecharGavetas);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharGavetas(); fecharMenu(); } });
  document.getElementById('sacola-corpo').addEventListener('click', (e) => {
    const d = e.target.closest('[data-delta]');
    const t = e.target.closest('[data-tirar]');
    if (d) {
      const id = d.closest('[data-qtd]').dataset.qtd;
      const it = sacola.itens.find((x) => x.id === id);
      const passo = (it?.min || 1) >= 10 ? 5 : 1;
      sacola.mudar(id, it.qtd + Number(d.dataset.delta) * passo);
    }
    if (t) sacola.tirar(t.dataset.tirar);
  });
  document.getElementById('sacola-rodape').addEventListener('submit', (e) => {
    e.preventDefault();
    window.open(linkWpp(ajustes.whatsapp, mensagemPedido(e.target)), '_blank', 'noopener');
  });

  // "+" rápido nos cards
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault();
    const p = registro.get(b.dataset.add);
    if (!p) return;
    sacola.adicionar(p, p.min_qty || 1);
    b.classList.add('feito');
    b.innerHTML = ic('check', '');
    setTimeout(() => { b.classList.remove('feito'); b.innerHTML = ic('mais', ''); }, 1600);
    toast(`${p.name} na sacola`, { rotulo: 'Ver sacola', fazer: abrirSacola });
  });

  // Cabeçalho sólido ao rolar e botão flutuante
  const topo = document.getElementById('topo');
  const flutuante = document.querySelector('.flutuante');
  if (topoSolido) topo?.classList.add('topo--solido');
  const aoRolar = () => {
    const y = scrollY;
    topo?.classList.toggle('is-solido', y > 30);
    flutuante?.classList.toggle('visivel', y > innerHeight * 0.7);
  };
  aoRolar();
  addEventListener('scroll', aoRolar, { passive: true });

  atualizarContador();
  ligarWpp();
  revelar();
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
}

/* ============ Ajustes da loja (WhatsApp, Instagram, aviso) ============ */

export function aplicarAjustes(s = {}) {
  ajustes = { ...ajustes, ...s };
  if (s.whatsapp) localStorage.setItem('sev_wpp', s.whatsapp);
  ligarWpp();
  if (s.instagram) {
    const url = `https://www.instagram.com/${encodeURIComponent(s.instagram)}/`;
    document.querySelectorAll('.js-insta').forEach((a) => { a.href = url; });
    document.querySelectorAll('.js-insta-nome').forEach((el) => { el.textContent = '@' + s.instagram; });
  }
  document.querySelectorAll('.js-fone').forEach((el) => { el.textContent = telefoneBonito(ajustes.whatsapp); });
  const aviso = document.getElementById('aviso');
  if (aviso) { aviso.textContent = s.announcement || ''; aviso.hidden = !s.announcement; }
}
export function ligarWpp() {
  document.querySelectorAll('.js-wpp').forEach((a) => {
    a.href = linkWpp(ajustes.whatsapp, a.dataset.msg || 'Olá!');
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

/* ============ Revelar ao rolar ============ */

let observador = null;
export function revelar(raiz = document) {
  if (!observador && 'IntersectionObserver' in window) {
    observador = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visivel'); observador.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
  }
  raiz.querySelectorAll('.reveal:not(.is-visivel), .reveal-img:not(.is-visivel)').forEach((el) => (observador ? observador.observe(el) : el.classList.add('is-visivel')));
}

/* ============ Carrossel com setas ============ */

export function ligarCarrossel(trilho, ant, prox) {
  if (!trilho || !ant || !prox) return;
  const passo = () => (trilho.firstElementChild?.getBoundingClientRect().width || 300) + 20;
  const atualizar = () => {
    ant.disabled = trilho.scrollLeft < 8;
    prox.disabled = trilho.scrollLeft + trilho.clientWidth > trilho.scrollWidth - 8;
  };
  ant.addEventListener('click', () => trilho.scrollBy({ left: -passo(), behavior: 'smooth' }));
  prox.addEventListener('click', () => trilho.scrollBy({ left: passo(), behavior: 'smooth' }));
  trilho.addEventListener('scroll', atualizar, { passive: true });
  addEventListener('resize', atualizar);
  atualizar();
}
