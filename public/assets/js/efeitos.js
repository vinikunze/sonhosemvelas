// Efeitos de movimento do site: rolagem suave, textos que sobem palavra por palavra,
// parallax, cards com inclinação 3D, botões magnéticos, cursor, letreiro que reage à
// rolagem, arrastar carrosséis, vela que "voa" para a sacola e abertura da página.
// Tudo usa só transform/opacity e respeita "reduzir movimento" do aparelho.

const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mouse = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

let lenis = null;
let velocidade = 0; // velocidade da rolagem (px por quadro), usada pelo letreiro
const tarefas = new Set(); // funções chamadas a cada quadro

function loop(t) {
  if (lenis) lenis.raf(t);
  for (const f of tarefas) f(t);
  requestAnimationFrame(loop);
}

/* ---------- Rolagem suave (computador) ---------- */
function carregarLenis() {
  return new Promise((ok) => {
    const s = document.createElement('script');
    s.src = '/assets/vendor/lenis.min.js';
    s.onload = () => ok(window.Lenis);
    s.onerror = () => ok(null);
    document.head.append(s);
  });
}

async function rolagemSuave() {
  const Lenis = await carregarLenis();
  if (!Lenis) return;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  // Áreas com rolagem própria (sacola, filtros, menu, carrosséis) não passam pelo Lenis
  const marcar = () => document.querySelectorAll('.gaveta__corpo, .folha__corpo, .menu-tela, .carrossel, .galeria, .abas-loja__trilho, .pp-galeria__trilho')
    .forEach((el) => el.setAttribute('data-lenis-prevent', ''));
  marcar();
  new MutationObserver(marcar).observe(document.body, { childList: true, subtree: true });
  // Pausa enquanto a sacola, o menu ou os filtros estão abertos
  new MutationObserver(() => (document.body.classList.contains('travado') ? lenis.stop() : lenis.start()))
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // Âncoras (#contato etc.) deslizam
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    const hash = a.getAttribute('href').replace(/^\//, '');
    if (a.getAttribute('href').startsWith('/#') && location.pathname !== '/') return;
    const alvo = hash.length > 1 && document.querySelector(hash);
    if (!alvo) return;
    e.preventDefault();
    lenis.scrollTo(alvo, { offset: -90, duration: 1.4 });
    history.replaceState(null, '', hash);
  });
}

/* ---------- Barra de progresso da leitura ---------- */
function barraProgresso() {
  const barra = document.createElement('div');
  barra.className = 'progresso';
  document.body.append(barra);
  let ultimoY = scrollY;
  tarefas.add(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    velocidade = lerp(velocidade, scrollY - ultimoY, 0.12);
    ultimoY = scrollY;
  });
}

/* ---------- Títulos que sobem palavra por palavra ---------- */
export function dividirTitulos(raiz = document) {
  raiz.querySelectorAll('.titulo-2, .impacto h2, .loja-cab h1, .cta-loja__caixa h2, .pp-info h1').forEach((el) => {
    if (el.dataset.dividido) return;
    el.dataset.dividido = '1';
    let i = 0;
    const embrulhar = (no) => {
      const s = document.createElement('span');
      s.className = 'palavra';
      s.style.setProperty('--i', i++);
      return s;
    };
    for (const no of [...el.childNodes]) {
      if (no.nodeType === 3) {
        const partes = no.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const p of partes) {
          if (!p) continue;
          if (/^\s+$/.test(p)) { frag.append(' '); continue; }
          const w = embrulhar();
          const dentro = document.createElement('span');
          dentro.textContent = p;
          w.append(dentro);
          frag.append(w);
        }
        no.replaceWith(frag);
      } else if (no.nodeType === 1 && no.tagName !== 'BR') {
        // <em> com degradê sobe inteiro (separar quebraria o efeito do degradê)
        const w = embrulhar();
        no.replaceWith(w);
        w.append(no);
        no.classList.add('palavra__em');
      }
    }
    el.classList.add('dividido');
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
}

/* ---------- Parallax suave em fotos ---------- */
function parallax() {
  const itens = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? itens.set(e.target, true) : itens.delete(e.target))), { rootMargin: '20% 0px' });
  const registrar = () => document.querySelectorAll('[data-paralaxe]:not([data-px-ok])').forEach((el) => { el.dataset.pxOk = '1'; io.observe(el); });
  registrar();
  new MutationObserver(registrar).observe(document.body, { childList: true, subtree: true });
  tarefas.add(() => {
    const h = innerHeight;
    for (const el of itens.keys()) {
      const r = el.parentElement.getBoundingClientRect();
      const centro = (r.top + r.height / 2 - h / 2) / h; // -1..1
      const f = Number(el.dataset.paralaxe) || 0.08;
      el.style.transform = `translate3d(0, ${(centro * f * -100).toFixed(2)}px, 0) scale(${1 + f})`;
    }
  });
}

/* ---------- Letreiro que acelera e inverte com a rolagem ---------- */
function letreiro() {
  const trilho = document.querySelector('.letreiro__trilho');
  if (!trilho) return;
  trilho.style.animation = 'none';
  let x = 0;
  let dir = -1;
  tarefas.add(() => {
    const meio = trilho.scrollWidth / 2;
    if (!meio) return;
    if (Math.abs(velocidade) > 0.4) dir = velocidade > 0 ? -1 : 1;
    x += dir * (0.45 + Math.min(Math.abs(velocidade) * 0.25, 9));
    if (x <= -meio) x += meio;
    if (x > 0) x -= meio;
    trilho.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}

/* ---------- Cards com inclinação 3D e brilho (computador) ---------- */
function inclinacao() {
  const SEL = '.produto-card, .vitrine > a, .ocasioes article, .passos li';
  let atual = null;
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest(SEL);
    if (atual && atual !== card) { soltar(atual); atual = null; }
    if (!card) return;
    atual = card;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const forca = card.matches('.produto-card') ? 7 : 4;
    card.classList.add('inclinado');
    card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * forca).toFixed(2)}deg) rotateY(${((px - 0.5) * forca).toFixed(2)}deg) translateY(-4px)`;
    card.style.setProperty('--bx', `${(px * 100).toFixed(1)}%`);
    card.style.setProperty('--by', `${(py * 100).toFixed(1)}%`);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (atual) soltar(atual); atual = null; });
  function soltar(card) {
    card.classList.remove('inclinado');
    card.style.transform = '';
  }
}

/* ---------- Botões magnéticos (computador) ---------- */
function magnetico() {
  const SEL = '.btn, .circ-seta, .carrossel-nav button, .btn-icone, .btn-menu, .link-seta, .add-rapido';
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest(SEL);
    document.querySelectorAll('.magnetico').forEach((m) => { if (m !== el) { m.classList.remove('magnetico'); m.style.translate = ''; } });
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    el.classList.add('magnetico');
    el.style.translate = `${(dx * 8).toFixed(1)}px ${(dy * 6).toFixed(1)}px`;
  }, { passive: true });
}

/* ---------- Cursor: anel que segue o mouse e cresce sobre o que é clicável ---------- */
function cursor() {
  const anel = document.createElement('div');
  anel.className = 'cursor';
  anel.innerHTML = '<span></span>';
  document.body.append(anel);
  let x = innerWidth / 2, y = innerHeight / 2, ax = x, ay = y, visivel = false;
  document.addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!visivel) { visivel = true; ax = x; ay = y; anel.classList.add('ativo'); }
    const alvo = e.target.closest('a, button, label, summary, input, textarea, select, [role="tab"]');
    const card = e.target.closest('.produto-card__foto, .vitrine > a');
    anel.classList.toggle('sobre', !!alvo && !card);
    anel.classList.toggle('ver', !!card);
    anel.querySelector('span').textContent = card ? 'Ver' : '';
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visivel = false; anel.classList.remove('ativo'); });
  document.addEventListener('pointerdown', () => anel.classList.add('clique'));
  document.addEventListener('pointerup', () => anel.classList.remove('clique'));
  tarefas.add(() => {
    ax = lerp(ax, x, 0.2); ay = lerp(ay, y, 0.2);
    anel.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
  });
}

/* ---------- Arrastar carrosséis com o mouse ---------- */
function arrastar() {
  let ativo = null, inicioX = 0, inicioScroll = 0, moveu = false, vel = 0, ultimoX = 0;
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const t = e.target.closest('.carrossel, .galeria');
    if (!t || e.target.closest('button')) return;
    ativo = t; inicioX = ultimoX = e.clientX; inicioScroll = t.scrollLeft; moveu = false; vel = 0;
  });
  document.addEventListener('pointermove', (e) => {
    if (!ativo) return;
    const dx = e.clientX - inicioX;
    if (!moveu && Math.abs(dx) > 6) { moveu = true; ativo.classList.add('arrastando'); }
    if (moveu) { ativo.scrollLeft = inicioScroll - dx; vel = e.clientX - ultimoX; ultimoX = e.clientX; }
  });
  document.addEventListener('pointerup', () => {
    if (!ativo) return;
    const t = ativo;
    ativo = null;
    if (!moveu) return;
    // impulso ao soltar, depois volta o encaixe
    let v = -vel * 1.6;
    const deslizar = () => {
      t.scrollLeft += v; v *= 0.92;
      if (Math.abs(v) > 0.5) requestAnimationFrame(deslizar); else t.classList.remove('arrastando');
    };
    requestAnimationFrame(deslizar);
    // evita abrir o produto ao terminar de arrastar
    const bloquear = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    t.addEventListener('click', bloquear, { capture: true, once: true });
    setTimeout(() => t.removeEventListener('click', bloquear, { capture: true }), 50);
  });
  document.addEventListener('dragstart', (e) => { if (e.target.closest('.carrossel, .galeria')) e.preventDefault(); });
}

/* ---------- Vela da capa: segue o mouse e a chama sente o "vento" ---------- */
function velaViva() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  let mx = 0, my = 0, ax = 0, ay = 0, ultimoX = 0, vento = 0, alvoVento = 0;
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width - 0.5;
    my = (e.clientY - r.top) / r.height - 0.5;
    alvoVento = Math.max(-1, Math.min(1, (e.clientX - ultimoX) / 18));
    ultimoX = e.clientX;
  }, { passive: true });
  tarefas.add(() => {
    const arte = document.querySelector('#hero-arte svg');
    if (!arte) return;
    ax = lerp(ax, mx, 0.06); ay = lerp(ay, my, 0.06);
    alvoVento *= 0.9;
    vento = lerp(vento, alvoVento + velocidade * 0.03, 0.12);
    arte.style.translate = `${(ax * 26).toFixed(1)}px ${(ay * 18).toFixed(1)}px`;
    const v = arte.querySelector('.vento');
    if (v) v.style.transform = `rotate(${(vento * -14).toFixed(2)}deg)`;
  });
}

/* ---------- Vela que "voa" até a sacola ---------- */
export function voarParaSacola(origem) {
  const destino = [...document.querySelectorAll('[data-abrir-sacola]')].find((b) => b.offsetParent !== null);
  if (!origem || !destino || reduzir) return;
  const a = origem.getBoundingClientRect();
  const b = destino.getBoundingClientRect();
  const clone = origem.cloneNode(true);
  clone.removeAttribute('id');
  Object.assign(clone.style, {
    position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
    zIndex: 200, borderRadius: '18px', overflow: 'hidden', pointerEvents: 'none', objectFit: 'cover', margin: 0,
    boxShadow: '0 20px 50px rgba(58,42,77,.3)',
  });
  clone.classList.add('voando');
  document.body.append(clone);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const escala = Math.max(0.08, 34 / a.width);
  const anim = clone.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '18px' },
    { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 80}px) scale(${(1 + escala) / 2.2})`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(${escala})`, opacity: 0.2, borderRadius: '50%' },
  ], { duration: 820, easing: 'cubic-bezier(.55,0,.25,1)' });
  anim.onfinish = () => {
    clone.remove();
    destino.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' });
  };
}

/* ---------- Abertura (só na primeira visita da sessão, só na página inicial) ---------- */
function abertura() {
  if (location.pathname !== '/' || sessionStorage.getItem('sev_abertura')) return;
  sessionStorage.setItem('sev_abertura', '1');
  const el = document.createElement('div');
  el.className = 'abertura';
  el.innerHTML = `<div class="abertura__miolo">
      <img src="/assets/img/logo.png" alt="" width="96" height="96">
      <span class="abertura__chama"></span>
      <p>Sonhos em Velas</p>
    </div>`;
  document.body.append(el);
  document.body.classList.add('abrindo');
  setTimeout(() => el.classList.add('sair'), 1050);
  setTimeout(() => { el.remove(); document.body.classList.remove('abrindo'); }, 1900);
}

/* ---------- Início ---------- */
export function iniciarEfeitos() {
  document.documentElement.classList.toggle('mouse', mouse);
  dividirTitulos();
  if (reduzir) return;
  abertura();
  barraProgresso();
  parallax();
  letreiro();
  velaViva();
  if (mouse) {
    rolagemSuave();
    inclinacao();
    magnetico();
    cursor();
    arrastar();
  }
  requestAnimationFrame(loop);
}
