// Funções compartilhadas pelo site público

export const WPP_PADRAO = '5566996359962';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export function preco(cents) {
  if (cents === null || cents === undefined) return null;
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function linkWpp(numero, mensagem) {
  const n = String(numero || WPP_PADRAO).replace(/\D/g, '');
  return `https://wa.me/${n}?text=${encodeURIComponent(mensagem)}`;
}

export function fotoUrl(key) {
  return `/fotos/${encodeURIComponent(key)}`;
}

export function normalizar(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Ilustração usada quando o produto ainda não tem foto
const TONS = [
  ['#FDEEF3', '#FBCFE0', '#E97FAE'],
  ['#F7EFEA', '#EBD3C6', '#C99A86'],
  ['#EEF3EE', '#CFE0D0', '#93B496'],
  ['#FFF6E6', '#FFE0A8', '#E0A94A'],
];
export function ilustracao(seed = '') {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [fundo, cera, borda] = TONS[h % TONS.length];
  return `<svg viewBox="0 0 400 500" role="img" aria-label="Foto em breve" preserveAspectRatio="xMidYMid slice">
    <rect width="400" height="500" fill="${fundo}"/>
    <circle cx="200" cy="170" r="120" fill="#fff" opacity=".55"/>
    <rect x="128" y="200" width="144" height="180" rx="20" fill="#fff" opacity=".6" stroke="${borda}" stroke-opacity=".5"/>
    <path d="M136 240 Q200 230 264 240 L264 362 Q264 372 254 372 L146 372 Q136 372 136 362 Z" fill="${cera}"/>
    <ellipse cx="200" cy="238" rx="64" ry="8" fill="#fff" opacity=".7"/>
    <line x1="200" y1="238" x2="200" y2="220" stroke="#3A1F2E" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M200 168 C212 186 214 200 207 210 C204 215 196 215 193 210 C186 200 188 186 200 168 Z" fill="#FFD58A"/>
    <text x="200" y="440" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="15" fill="${borda}" letter-spacing="2">FOTO EM BREVE</text>
  </svg>`;
}

export function cardProduto(p, i = 0) {
  const valor = preco(p.price_cents);
  const foto = p.images[0]
    ? `<img src="${fotoUrl(p.images[0])}" alt="${esc(p.name)}" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async" width="400" height="500">`
    : ilustracao(p.slug);
  const etiqueta = !p.available
    ? '<span class="etiqueta etiqueta--esgotado">Esgotado</span>'
    : p.featured ? '<span class="etiqueta">Destaque</span>' : '';
  return `<a class="card${p.available ? '' : ' card--esgotado'}" href="/p/${encodeURIComponent(p.slug)}" style="animation-delay:${Math.min(i, 12) * 40}ms">
    <div class="card__foto">${etiqueta}${foto}</div>
    <div class="card__corpo">
      <h3 class="card__nome">${esc(p.name)}</h3>
      ${p.aroma ? `<p class="card__aroma">${esc(p.aroma)}</p>` : ''}
      <p class="card__preco${valor ? '' : ' card__preco--consulta'}">${valor || 'Sob consulta'}</p>
    </div>
  </a>`;
}

// Liga todos os botões de WhatsApp da página ao número configurado
export function ligarWpp(numero) {
  document.querySelectorAll('.js-wpp').forEach((a) => {
    a.href = linkWpp(numero, a.dataset.msg || 'Olá!');
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

export function ligarInsta(usuario) {
  if (!usuario) return;
  const url = `https://www.instagram.com/${encodeURIComponent(usuario)}/`;
  document.querySelectorAll('.js-insta, #link-insta').forEach((a) => (a.href = url));
  const h = document.getElementById('insta-handle');
  if (h) h.textContent = '@' + usuario;
}

export function mostrarAviso(texto) {
  const el = document.getElementById('aviso');
  if (!el) return;
  if (texto) { el.textContent = texto; el.hidden = false; } else el.hidden = true;
}

// Animações de entrada, topo com fundo ao rolar e botão flutuante
export function efeitos() {
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('is-visivel'); io.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;
  document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('is-visivel')));

  const topo = document.getElementById('topo');
  const flutuante = document.querySelector('.wpp-flutuante');
  const aoRolar = () => {
    const y = window.scrollY;
    topo?.classList.toggle('is-rolado', y > 24);
    flutuante?.classList.toggle('is-visivel', y > window.innerHeight * 0.6);
  };
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
}

export function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg;
  t.classList.add('is-visivel');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('is-visivel'), 2400);
}
