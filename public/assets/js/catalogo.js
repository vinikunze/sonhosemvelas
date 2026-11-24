// Catálogo (loja): abas por coleção, filtros, sacola, envio por WhatsApp/link e PDF
import {
  montarCasca, aplicarAjustes, registrarProdutos, cardProduto, normalizar, slug, esc, precoInfo, toast, pareceAdmin,
  fecharGavetas, revelar,
} from './comum.js';

montarCasca({ topoSolido: true });

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const estado = {
  categoria: params.get('categoria') || '',
  momento: params.get('momento') || '',
  busca: params.get('q') || '',
  ordem: '',
  soPromo: false,
  soDisponivel: false,
};
let dados = { produtos: [], categorias: [], settings: {} };
let admin = false;

/* ---------- Filtrar ---------- */

function filtrados({ ignorarCategoria = false } = {}) {
  const termo = normalizar(estado.busca.trim());
  let lista = dados.produtos.filter((p) => {
    if (!ignorarCategoria && estado.categoria && p.category_slug !== estado.categoria) return false;
    if (estado.momento && !(p.occasions || []).some((o) => slug(o) === estado.momento)) return false;
    if (estado.soPromo && !precoInfo(p).desconto) return false;
    if (estado.soDisponivel && !p.available) return false;
    if (termo && !normalizar(`${p.name} ${p.aroma} ${p.size} ${p.description} ${p.category_name || ''} ${(p.occasions || []).join(' ')}`).includes(termo)) return false;
    return true;
  });
  const valor = (p) => precoInfo(p).final ?? Infinity;
  const ordenar = {
    menor: (a, b) => valor(a) - valor(b),
    maior: (a, b) => (precoInfo(b).final ?? -1) - (precoInfo(a).final ?? -1),
    promo: (a, b) => precoInfo(b).desconto - precoInfo(a).desconto,
    nome: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
  }[estado.ordem];
  if (ordenar) lista = [...lista].sort(ordenar);
  return [...lista].sort((a, b) => Number(b.available) - Number(a.available));
}

function nomeMomento(k) {
  for (const p of dados.produtos) for (const o of p.occasions || []) if (slug(o) === k) return o;
  return k;
}

function render() {
  const lista = filtrados();
  $('#grade').innerHTML = lista.map((p, i) => cardProduto(p, i, { admin })).join('');
  $('#vazio').hidden = lista.length > 0;
  $('#total').textContent = `${lista.length} ${lista.length === 1 ? 'vela' : 'velas'}`;

  // Filtros ativos (removíveis)
  const ativos = [
    estado.momento && ['momento', nomeMomento(estado.momento)],
    estado.busca && ['busca', `"${estado.busca}"`],
    estado.soPromo && ['soPromo', 'Promoções'],
    estado.soDisponivel && ['soDisponivel', 'Disponíveis'],
  ].filter(Boolean);
  $('#filtros-ativos').innerHTML = ativos.map(([k, t]) => `<button type="button" data-tirar-filtro="${k}" aria-label="Tirar filtro ${esc(t)}">${esc(t)}</button>`).join('');
  const n = ativos.length + (estado.ordem ? 1 : 0);
  $('#filtros-n').textContent = n;
  $('#filtros-n').hidden = !n;

  atualizarUrl();
}

function renderAbas() {
  const base = filtrados({ ignorarCategoria: true });
  const comItens = dados.categorias
    .map((c) => ({ ...c, total: base.filter((p) => p.category_slug === c.slug).length }))
    .filter((c) => c.total > 0 || c.slug === estado.categoria);
  const abas = [{ slug: '', name: 'Todas' }, ...comItens];
  $('#abas-trilho').innerHTML = abas
    .map((c) => `<button type="button" class="aba-loja" role="tab" data-cat="${esc(c.slug)}" aria-selected="${c.slug === estado.categoria}">${esc(c.name)}</button>`)
    .join('');
  $('#abas-trilho .aba-loja[aria-selected="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function renderMomentos() {
  const mapa = new Map();
  for (const p of dados.produtos) for (const o of p.occasions || []) if (!mapa.has(slug(o))) mapa.set(slug(o), o);
  $('#grupo-momentos').hidden = !mapa.size;
  $('#pilulas-momento').innerHTML = [...mapa.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
    .map(([k, nome]) => `<button type="button" class="pilula" data-momento="${esc(k)}" aria-pressed="${k === estado.momento}">${esc(nome)}</button>`)
    .join('');
}

function atualizarUrl() {
  const url = new URL(location.href);
  const definir = (k, v) => (v ? url.searchParams.set(k, v) : url.searchParams.delete(k));
  definir('categoria', estado.categoria);
  definir('momento', estado.momento);
  definir('q', estado.busca.trim());
  history.replaceState(null, '', url);
  atualizarEnvio();
}

function tudo() { renderAbas(); render(); }

/* ---------- Eventos ---------- */

$('#abas-trilho').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  estado.categoria = b.dataset.cat;
  document.querySelectorAll('.aba-loja').forEach((a) => a.setAttribute('aria-selected', String(a === b)));
  b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  render();
  const topo = $('#abas').getBoundingClientRect().top + scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--topo-h'), 10);
  if (scrollY > topo + 4) scrollTo({ top: topo, behavior: 'smooth' });
});

$('#filtros-ativos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tirar-filtro]');
  if (!b) return;
  const k = b.dataset.tirarFiltro;
  estado[k] = typeof estado[k] === 'boolean' ? false : '';
  sincronizarFolha();
  tudo();
});

const folha = $('#folha-filtros');
function abrirFolha() {
  sincronizarFolha();
  folha.classList.add('aberta');
  $('#veu').classList.add('aberto');
  document.body.classList.add('travado');
}
function sincronizarFolha() {
  $('#busca').value = estado.busca;
  document.querySelectorAll('[data-momento]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.momento === estado.momento)));
  document.querySelectorAll('[data-ordem]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ordem === estado.ordem)));
  $('#so-promo').setAttribute('aria-pressed', String(estado.soPromo));
  $('#so-disponivel').setAttribute('aria-pressed', String(estado.soDisponivel));
}
$('#abrir-filtros').addEventListener('click', abrirFolha);
folha.querySelector('[data-fechar-folha]').addEventListener('click', fecharGavetas);
$('#pilulas-momento').addEventListener('click', (e) => {
  const b = e.target.closest('[data-momento]');
  if (!b) return;
  estado.momento = estado.momento === b.dataset.momento ? '' : b.dataset.momento;
  sincronizarFolha(); tudo();
});
$('#pilulas-ordem').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ordem]');
  if (!b) return;
  estado.ordem = b.dataset.ordem;
  sincronizarFolha(); render();
});
$('#so-promo').addEventListener('click', () => { estado.soPromo = !estado.soPromo; sincronizarFolha(); tudo(); });
$('#so-disponivel').addEventListener('click', () => { estado.soDisponivel = !estado.soDisponivel; sincronizarFolha(); tudo(); });
let t;
$('#busca').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { estado.busca = e.target.value; tudo(); }, 160); });
$('#busca').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fecharGavetas(); } });
$('#aplicar-filtros').addEventListener('click', () => { fecharGavetas(); scrollTo({ top: $('#abas').offsetTop - 60, behavior: 'smooth' }); });
function limpar() {
  Object.assign(estado, { momento: '', busca: '', ordem: '', soPromo: false, soDisponivel: false });
  sincronizarFolha(); tudo();
}
$('#limpar-filtros').addEventListener('click', limpar);
$('#limpar-tudo').addEventListener('click', () => { estado.categoria = ''; limpar(); });

/* ---------- Enviar, copiar link e PDF ---------- */

function nomeCategoria() {
  return dados.categorias.find((c) => c.slug === estado.categoria)?.name || '';
}
function linkCatalogo() {
  const url = new URL('/catalogo', location.origin);
  if (estado.categoria) url.searchParams.set('categoria', estado.categoria);
  if (estado.momento) url.searchParams.set('momento', estado.momento);
  return url.toString();
}
function atualizarEnvio() {
  const cat = nomeCategoria();
  const texto = `Olá! Este é o catálogo da *Sonhos em Velas*${cat ? ` (${cat})` : ''}: velas aromáticas artesanais feitas à mão em Sinop. Dá uma olhada:\n\n${linkCatalogo()}`;
  $('#enviar-wpp').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

$('#copiar-link').addEventListener('click', async () => {
  const url = linkCatalogo();
  try { await navigator.clipboard.writeText(url); toast('Link do catálogo copiado'); return; } catch { /* segue */ }
  try { await navigator.share?.({ title: 'Catálogo Sonhos em Velas', url }); } catch { /* cancelado */ }
});

$('#baixar-pdf').addEventListener('click', async (e) => {
  const botao = e.currentTarget;
  const lista = filtrados();
  if (!lista.length) { toast('Nenhuma vela para colocar no PDF'); return; }
  const caixa = $('#pdf-progresso');
  botao.disabled = true;
  caixa.hidden = false;
  $('#pdf-barra').style.width = '0%';
  try {
    const { gerarPdf } = await import('./pdf.js');
    await gerarPdf({
      produtos: lista,
      categorias: dados.categorias,
      settings: dados.settings,
      titulo: [nomeCategoria(), estado.momento && nomeMomento(estado.momento)].filter(Boolean).join(' · '),
      link: linkCatalogo(),
      origem: location.origin,
      progresso: (feito, total) => {
        $('#pdf-texto').textContent = feito < total ? `Montando o catálogo... ${feito} de ${total}` : 'Pronto! Baixando...';
        $('#pdf-barra').style.width = `${Math.round((feito / total) * 100)}%`;
      },
    });
  } catch (err) {
    console.error(err);
    toast('Não foi possível gerar o PDF. Tente de novo.');
  } finally {
    setTimeout(() => { caixa.hidden = true; botao.disabled = false; }, 600);
  }
});

/* ---------- Administradora ---------- */

async function verificarAdmin() {
  if (!pareceAdmin()) return;
  try { admin = !!(await (await fetch('/api/admin/sessao')).json()).logado; } catch { admin = false; }
  $('#adm-barra').hidden = !admin;
  if (admin) render();
}

/* ---------- Carregar ---------- */

async function carregar() {
  try {
    const r = await fetch('/api/catalogo');
    if (!r.ok) throw new Error(r.status);
    dados = await r.json();
    aplicarAjustes(dados.settings);
    registrarProdutos(dados.produtos);
    const n = dados.produtos.length;
    $('#cat-resumo').textContent = `${n} ${n === 1 ? 'vela' : 'velas'} feitas à mão em Sinop. Toque no + para colocar na sacola e finalize pelo WhatsApp.`;
    renderMomentos();
    sincronizarFolha();
    tudo();
    verificarAdmin();
  } catch {
    $('#grade').innerHTML = '';
    $('#vazio').hidden = false;
    $('#vazio').innerHTML = '<h2>Ops!</h2><p>Não foi possível carregar o catálogo agora.</p><a class="btn btn--linha" href="">Tentar de novo</a>';
  }
  revelar();
}

carregar();
