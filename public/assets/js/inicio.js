// Página inicial (apresentação): destaques da semana, tipos de vela e movimento
import { cardProduto, efeitos, revelar, ligarWpp, ligarInsta, mostrarAviso, esc, fotoUrl, ilustracao } from './comum.js';

const carrossel = document.getElementById('carrossel');
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

efeitos();
ligarWpp();
document.documentElement.classList.add('js');

/* ---------- Movimento do topo ---------- */

// Título entra palavra por palavra
requestAnimationFrame(() => document.querySelector('.titulo-anima')?.classList.add('is-pronto'));

// Vela com leve parallax ao rolar e brilho que segue o dedo/mouse
const vela = document.getElementById('hero-vela');
const hero = document.querySelector('.hero');
if (!reduzir && vela && hero) {
  let alvoY = 0, atualY = 0, rodando = false;
  const passo = () => {
    atualY += (alvoY - atualY) * 0.12;
    vela.style.transform = `translate3d(0, ${atualY.toFixed(2)}px, 0)`;
    if (Math.abs(alvoY - atualY) > 0.1) requestAnimationFrame(passo); else rodando = false;
  };
  addEventListener('scroll', () => {
    if (scrollY > innerHeight * 1.2) return;
    alvoY = scrollY * -0.12;
    if (!rodando) { rodando = true; requestAnimationFrame(passo); }
  }, { passive: true });

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    hero.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

/* ---------- Letreiro (faixa que corre) ---------- */

function montarLetreiro(nomes) {
  const trilho = document.getElementById('letreiro');
  if (!trilho) return;
  const itens = [...new Set([...nomes, 'Feitas à mão em Sinop', 'Aromas que acolhem'])];
  const grupo = itens.map((n) => `<span>${esc(n)}</span>`).join('');
  // duas cópias para o loop ficar contínuo
  trilho.innerHTML = grupo + grupo;
}

/* ---------- Destaques da semana ---------- */

function setasCarrossel() {
  const ant = document.getElementById('dest-ant');
  const prox = document.getElementById('dest-prox');
  const passo = () => {
    const card = carrossel.querySelector('.card, .card-wrap');
    return card ? card.getBoundingClientRect().width + 20 : 300;
  };
  const atualizar = () => {
    ant.disabled = carrossel.scrollLeft < 8;
    prox.disabled = carrossel.scrollLeft + carrossel.clientWidth > carrossel.scrollWidth - 8;
  };
  ant.addEventListener('click', () => carrossel.scrollBy({ left: -passo(), behavior: 'smooth' }));
  prox.addEventListener('click', () => carrossel.scrollBy({ left: passo(), behavior: 'smooth' }));
  carrossel.addEventListener('scroll', atualizar, { passive: true });
  addEventListener('resize', atualizar);
  atualizar();
}

function renderDestaques(produtos, settings) {
  document.getElementById('dest-titulo').textContent = settings.home_title || 'Destaques da semana';
  const sub = document.getElementById('dest-sub');
  sub.textContent = settings.home_subtitle || '';
  sub.hidden = !settings.home_subtitle;

  let lista = produtos.filter((p) => p.featured).sort((a, b) => a.featured_position - b.featured_position);
  // Se ela ainda não escolheu nenhum, mostra os primeiros do catálogo
  if (!lista.length) lista = produtos.slice(0, 6);
  if (!lista.length) {
    document.getElementById('destaques').hidden = true;
    return;
  }
  carrossel.innerHTML = lista.map((p, i) => cardProduto(p, i)).join('');
  carrossel.classList.toggle('carrossel--poucos', lista.length <= 3);
  setasCarrossel();
}

/* ---------- Tipos de vela ---------- */

function renderTipos(categorias, produtos) {
  const tipos = categorias
    .map((c) => {
      const itens = produtos.filter((p) => p.category_slug === c.slug);
      const comFoto = itens.find((p) => p.images.length);
      return { ...c, total: itens.length, foto: comFoto?.images[0], seed: itens[0]?.slug || c.slug };
    })
    .filter((c) => c.total > 0);
  if (!tipos.length) return;

  document.getElementById('tipos').hidden = false;
  document.getElementById('tipos-grade').innerHTML = tipos.map((c, i) => `
    <a class="tipo reveal" href="/catalogo?categoria=${encodeURIComponent(c.slug)}" style="--d:${i * 70}ms">
      <div class="tipo__foto">
        ${c.foto ? `<img src="${fotoUrl(c.foto)}" alt="" loading="lazy" decoding="async">` : ilustracao(c.seed).replace(/<text[\s\S]*?<\/text>/, '')}
      </div>
      <div class="tipo__texto">
        <h3>${esc(c.name)}</h3>
        <span>${c.total} ${c.total === 1 ? 'opção' : 'opções'} <i aria-hidden="true">→</i></span>
      </div>
    </a>`).join('');
  revelar(document.getElementById('tipos'));
}

/* ---------- Carregar ---------- */

async function carregar() {
  try {
    const r = await fetch('/api/catalogo');
    if (!r.ok) throw new Error(r.status);
    const { settings = {}, categorias, produtos } = await r.json();
    ligarWpp(settings.whatsapp);
    ligarInsta(settings.instagram);
    mostrarAviso(settings.announcement);
    const sobre = document.getElementById('sobre-texto');
    if (sobre) sobre.textContent = settings.about || '';
    const comProdutos = categorias.filter((c) => produtos.some((p) => p.category_slug === c.slug));
    if (comProdutos.length) montarLetreiro(comProdutos.map((c) => c.name));
    renderDestaques(produtos, settings);
    renderTipos(categorias, produtos);
  } catch {
    carrossel.innerHTML = '<p class="vazio">Não foi possível carregar os destaques agora. <a href="/catalogo">Ver catálogo</a></p>';
  }
}

carregar();
