// Página inicial: apresentação da marca, coleções, destaques, momentos e galeria
import {
  montarCasca, aplicarAjustes, registrarProdutos, cardProduto, velaArte, fotoUrl, esc, slug, ic, revelar, ligarCarrossel,
} from './comum.js';

montarCasca();
const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.getElementById('hero');

/* ---------- Topo: título, brasas e parallax ---------- */

requestAnimationFrame(() => setTimeout(() => hero.classList.add('pronto'), 80));

if (!reduzir) {
  const brasas = document.getElementById('brasas');
  brasas.innerHTML = Array.from({ length: 16 }, () => {
    const esq = 15 + Math.random() * 70;
    const dur = 7 + Math.random() * 9;
    const atraso = -Math.random() * dur;
    const x = (Math.random() * 120 - 60).toFixed(0);
    const t = (2 + Math.random() * 2.5).toFixed(1);
    return `<i style="left:${esq}%;width:${t}px;height:${t}px;animation-duration:${dur}s;animation-delay:${atraso}s;--x:${x}px"></i>`;
  }).join('');

  let alvo = 0, atual = 0, rodando = false;
  const camadas = () => [document.getElementById('hero-arte'), document.querySelector('#hero-midia img')].filter(Boolean);
  const passo = () => {
    atual += (alvo - atual) * 0.1;
    camadas().forEach((el) => { el.style.transform = `translate3d(0, ${(atual * 0.35).toFixed(1)}px, 0)${el.tagName === 'IMG' ? ' scale(1.06)' : ''}`; });
    if (Math.abs(alvo - atual) > 0.2) requestAnimationFrame(passo); else rodando = false;
  };
  addEventListener('scroll', () => {
    if (scrollY > innerHeight * 1.3) return;
    alvo = scrollY;
    if (!rodando) { rodando = true; requestAnimationFrame(passo); }
  }, { passive: true });
}

/* ---------- Seções montadas com os dados da loja ---------- */

const ICONE_CAT = (nome) => {
  const n = nome.toLowerCase();
  if (n.includes('gruta')) return 'gruta';
  if (n.includes('lembr')) return 'mini';
  if (n.includes('kit') || n.includes('present')) return 'presente';
  if (n.includes('pote')) return 'pote';
  return 'chama';
};

const DESCRICAO_MOMENTO = {
  presente: 'Para surpreender quem você ama',
  relaxar: 'Aromas para desacelerar no fim do dia',
  decoracao: 'Luz e perfume para a sua casa',
  lembrancinha: 'Para festas, eventos e agradecimentos',
  casamento: 'Delicadeza para o grande dia',
  aniversario: 'Para celebrar mais um ano',
  'cha-de-bebe': 'Lembranças doces para a chegada',
  religioso: 'Para a fé e a devoção',
  natal: 'Para iluminar as festas',
  'dia-das-maes': 'Um carinho para ela',
  'datas-especiais': 'Para os dias que merecem mais',
  corporativo: 'Presentes para clientes e equipes',
};

function hero_(settings) {
  if (settings.hero_image) {
    const midia = document.getElementById('hero-midia');
    midia.innerHTML = `<img src="${fotoUrl(settings.hero_image)}" alt="" fetchpriority="high">`;
    midia.hidden = false;
    hero.classList.add('hero--foto');
    document.getElementById('hero-arte').hidden = true;
  } else {
    document.getElementById('hero-arte').innerHTML = velaArte('hero', { fundo: false });
  }
}

function colecoes(categorias, produtos) {
  const lista = categorias
    .map((c) => ({ ...c, itens: produtos.filter((p) => p.category_slug === c.slug) }))
    .filter((c) => c.itens.length);
  const ul = document.getElementById('colecoes-lista');
  ul.innerHTML = lista.map((c, i) => `
    <li class="reveal" style="--d:${i * 0.06}s">
      <a href="/catalogo?categoria=${encodeURIComponent(c.slug)}">
        ${ic(ICONE_CAT(c.name), 'colecoes__icone')}
        <div><span class="num">0${i + 1}</span><h3>${esc(c.name)}</h3><small>${c.itens.length} ${c.itens.length === 1 ? 'opção' : 'opções'}</small></div>
        <span class="circ-seta">${ic('seta', '')}</span>
      </a>
    </li>`).join('');
  document.getElementById('colecoes').hidden = !lista.length;

  // Vitrine com imagem
  if (lista.length >= 2) {
    document.getElementById('vitrine').hidden = false;
    document.getElementById('vitrine-grade').innerHTML = lista.slice(0, 5).map((c, i) => {
      const comFoto = c.itens.find((p) => p.images.length);
      return `<a class="reveal" style="--d:${i * 0.07}s" href="/catalogo?categoria=${encodeURIComponent(c.slug)}">
        ${comFoto ? `<img src="${fotoUrl(comFoto.images[0])}" alt="" loading="lazy">` : velaArte(c.slug + i)}
        <div class="vitrine__texto"><div><small>${c.itens.length} ${c.itens.length === 1 ? 'opção' : 'opções'}</small><h3>${esc(c.name)}</h3></div><span class="circ-seta">${ic('seta', '')}</span></div>
      </a>`;
    }).join('');
  }
}

function essencia(settings) {
  const caixa = document.getElementById('essencia-foto');
  caixa.insertAdjacentHTML('afterbegin', settings.about_image
    ? `<img src="${fotoUrl(settings.about_image)}" alt="Ateliê da Sonhos em Velas" loading="lazy">`
    : velaArte('essencia'));
  if (settings.about) document.getElementById('sobre-texto').textContent = settings.about;
}

function destaques(produtos, settings) {
  const titulo = settings.home_title || 'Destaques da semana';
  const partes = titulo.split(' ');
  const corte = partes.length <= 3 ? 1 : Math.ceil(partes.length / 2);
  document.getElementById('dest-titulo').innerHTML = `${esc(partes.slice(0, corte).join(' '))}<br><em>${esc(partes.slice(corte).join(' ') || '')}</em>`;
  const sub = document.getElementById('dest-sub');
  sub.textContent = settings.home_subtitle || '';
  sub.hidden = !settings.home_subtitle;

  let lista = produtos.filter((p) => p.featured).sort((a, b) => a.featured_position - b.featured_position);
  if (!lista.length) lista = produtos.slice(0, 8);
  const trilho = document.getElementById('carrossel');
  if (!lista.length) { document.getElementById('destaques').hidden = true; return; }
  trilho.innerHTML = lista.map((p, i) => cardProduto(p, i)).join('');
  ligarCarrossel(trilho, document.getElementById('dest-ant'), document.getElementById('dest-prox'));
}

function momentos(produtos) {
  const contagem = new Map();
  for (const p of produtos) for (const o of p.occasions || []) {
    const k = slug(o);
    const atual = contagem.get(k) || { nome: o, total: 0 };
    atual.total += 1;
    contagem.set(k, atual);
  }
  let lista = [...contagem.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8);
  const ul = document.getElementById('momentos-lista');
  if (!lista.length) {
    lista = [['presente', { nome: 'Presentear' }], ['decoracao', { nome: 'Decorar' }], ['relaxar', { nome: 'Relaxar' }], ['lembrancinha', { nome: 'Lembrancinhas' }]];
  }
  ul.innerHTML = lista.map(([k, m], i) => {
    const [primeira, ...resto] = m.nome.split(' ');
    return `<li class="reveal" style="--d:${(i % 2) * 0.06}s">
      <a href="/catalogo${m.total ? `?momento=${encodeURIComponent(k)}` : ''}">
        <span class="num">0${i + 1}</span>
        <div><h3>${esc(primeira)}${resto.length ? ` <em>${esc(resto.join(' '))}</em>` : ''}</h3><small>${esc(DESCRICAO_MOMENTO[k] || (m.total ? `${m.total} ${m.total === 1 ? 'opção' : 'opções'}` : 'Ver velas'))}</small></div>
        <span class="circ-seta">${ic('seta', '')}</span>
      </a>
    </li>`;
  }).join('');
}

function galeria(settings) {
  const fotos = settings.gallery || [];
  if (!fotos.length) return;
  document.getElementById('galeria').hidden = false;
  document.getElementById('galeria-trilho').innerHTML = fotos
    .map((k, i) => `<figure class="reveal" style="--d:${Math.min(i, 4) * 0.06}s"><img src="${fotoUrl(k)}" alt="" loading="lazy"><figcaption>0${i + 1}</figcaption></figure>`)
    .join('');
}

async function carregar() {
  try {
    const r = await fetch('/api/catalogo');
    if (!r.ok) throw new Error(r.status);
    const { settings = {}, categorias = [], produtos = [] } = await r.json();
    aplicarAjustes(settings);
    registrarProdutos(produtos);
    hero_(settings);
    colecoes(categorias, produtos);
    essencia(settings);
    destaques(produtos, settings);
    momentos(produtos);
    galeria(settings);
  } catch {
    document.getElementById('hero-arte').innerHTML = velaArte('hero', { fundo: false });
    document.getElementById('carrossel').innerHTML = '<p class="lead">Não foi possível carregar os produtos agora. <a href="/catalogo">Ver catálogo</a></p>';
  }
  revelar();
}

carregar();
