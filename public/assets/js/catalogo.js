// Página do catálogo: lista completa, filtros, envio por WhatsApp/link e PDF
import {
  cardProduto, efeitos, revelar, ligarWpp, ligarInsta, mostrarAviso, normalizar, esc, precoInfo, toast, pareceAdmin,
} from './comum.js';

const area = document.getElementById('produtos');
const chips = document.getElementById('chips');
const busca = document.getElementById('busca');
const ordem = document.getElementById('ordem');
const vazio = document.getElementById('vazio');

const params = new URLSearchParams(location.search);
let categoriaAtual = params.get('categoria') || '';
let dados = { produtos: [], categorias: [], settings: {} };
let admin = false;

efeitos();
ligarWpp();

/* ---------- Filtros e ordenação ---------- */

function filtrados() {
  const termo = normalizar(busca.value.trim());
  let lista = dados.produtos.filter((p) => {
    if (categoriaAtual && p.category_slug !== categoriaAtual) return false;
    if (!termo) return true;
    return normalizar(`${p.name} ${p.aroma} ${p.size} ${p.description} ${p.category_name || ''}`).includes(termo);
  });
  const valor = (p) => precoInfo(p).final ?? Infinity;
  const comparar = {
    promo: (a, b) => precoInfo(b).desconto - precoInfo(a).desconto,
    menor: (a, b) => valor(a) - valor(b),
    maior: (a, b) => (precoInfo(b).final ?? -1) - (precoInfo(a).final ?? -1),
    nome: (a, b) => a.name.localeCompare(b.name, 'pt-BR'),
  }[ordem.value];
  if (comparar) lista = [...lista].sort(comparar);
  // esgotados sempre no fim
  return [...lista].sort((a, b) => Number(b.available) - Number(a.available));
}

function grade(lista, inicio = 0) {
  return `<div class="grade">${lista.map((p, i) => cardProduto(p, inicio + i, { admin })).join('')}</div>`;
}

function render() {
  const lista = filtrados();
  vazio.hidden = lista.length > 0;
  const agrupar = !categoriaAtual && !busca.value.trim() && !ordem.value;

  if (!agrupar) {
    area.innerHTML = lista.length ? grade(lista) : '';
    return;
  }
  // Sem filtro: mostra separado por tipo de vela, na ordem das categorias
  const grupos = dados.categorias
    .map((c) => ({ ...c, itens: lista.filter((p) => p.category_slug === c.slug) }))
    .filter((g) => g.itens.length);
  const semCategoria = lista.filter((p) => !p.category_slug);
  if (semCategoria.length) grupos.push({ name: 'Outras velas', slug: '', itens: semCategoria });

  let n = 0;
  area.innerHTML = grupos.map((g) => {
    const html = `<section class="cat-grupo" aria-label="${esc(g.name)}">
      <div class="cat-grupo__cab reveal">
        <h2>${esc(g.name)}</h2>
        <span>${g.itens.length} ${g.itens.length === 1 ? 'opção' : 'opções'}</span>
      </div>
      ${grade(g.itens, n)}
    </section>`;
    n += g.itens.length;
    return html;
  }).join('');
  revelar(area);
}

function renderChips() {
  const comProdutos = dados.categorias
    .map((c) => ({ ...c, total: dados.produtos.filter((p) => p.category_slug === c.slug).length }))
    .filter((c) => c.total > 0);
  if (categoriaAtual && !comProdutos.some((c) => c.slug === categoriaAtual)) categoriaAtual = '';
  const itens = [{ slug: '', name: 'Todos', total: dados.produtos.length }, ...comProdutos];
  chips.innerHTML = itens
    .map((c) => `<button type="button" class="chip" role="tab" data-slug="${esc(c.slug)}" aria-selected="${c.slug === categoriaAtual}">${esc(c.name)}<small>${c.total}</small></button>`)
    .join('');
}

function atualizarUrl() {
  const url = new URL(location.href);
  if (categoriaAtual) url.searchParams.set('categoria', categoriaAtual); else url.searchParams.delete('categoria');
  history.replaceState(null, '', url);
  atualizarEnvio();
}

chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  categoriaAtual = b.dataset.slug;
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-selected', String(c === b)));
  atualizarUrl();
  render();
  const topoFiltros = document.getElementById('filtros').getBoundingClientRect().top + scrollY - 70;
  if (scrollY > topoFiltros) scrollTo({ top: topoFiltros, behavior: 'smooth' });
});

let t;
busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 120); });
ordem.addEventListener('change', render);

/* ---------- Enviar, copiar link e PDF ---------- */

function nomeCategoriaAtual() {
  return dados.categorias.find((c) => c.slug === categoriaAtual)?.name || '';
}

function linkCatalogo() {
  const url = new URL('/catalogo', location.origin);
  if (categoriaAtual) url.searchParams.set('categoria', categoriaAtual);
  return url.toString();
}

function atualizarEnvio() {
  const cat = nomeCategoriaAtual();
  const texto = `Olá! Este é o catálogo da *Sonhos em Velas*${cat ? ` (${cat})` : ''}, com velas aromáticas artesanais feitas à mão em Sinop. Dá uma olhada:\n\n${linkCatalogo()}`;
  // Sem número: o WhatsApp abre para escolher o contato
  document.getElementById('enviar-wpp').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

document.getElementById('compartilhar').addEventListener('click', async () => {
  const url = linkCatalogo();
  try {
    if (navigator.clipboard) { await navigator.clipboard.writeText(url); toast('Link do catálogo copiado!'); return; }
  } catch { /* segue para o compartilhar nativo */ }
  try { await navigator.share?.({ title: 'Catálogo Sonhos em Velas', url }); } catch { /* cancelado */ }
});

document.getElementById('baixar-pdf').addEventListener('click', async (e) => {
  const botao = e.currentTarget;
  const caixa = document.getElementById('pdf-progresso');
  const texto = document.getElementById('pdf-texto');
  const barra = document.getElementById('pdf-barra');
  const lista = filtrados();
  if (!lista.length) { toast('Nenhum produto para colocar no PDF'); return; }
  botao.disabled = true;
  caixa.hidden = false;
  barra.style.width = '0%';
  texto.textContent = 'Preparando o PDF...';
  try {
    const { gerarPdf } = await import('./pdf.js');
    await gerarPdf({
      produtos: lista,
      categorias: dados.categorias,
      settings: dados.settings,
      titulo: nomeCategoriaAtual(),
      link: linkCatalogo(),
      origem: location.origin,
      progresso: (feito, total) => {
        texto.textContent = feito < total ? `Montando o catálogo... ${feito} de ${total}` : 'Pronto! Baixando...';
        barra.style.width = `${Math.round((feito / total) * 100)}%`;
      },
    });
  } catch (err) {
    console.error(err);
    toast('Não foi possível gerar o PDF. Tente de novo.');
  } finally {
    setTimeout(() => { caixa.hidden = true; botao.disabled = false; }, 600);
  }
});

/* ---------- Modo administradora ---------- */

async function verificarAdmin() {
  if (!pareceAdmin()) return;
  try {
    const r = await fetch('/api/admin/sessao', { credentials: 'same-origin' });
    admin = !!(await r.json()).logado;
  } catch { admin = false; }
  document.getElementById('adm-barra').hidden = !admin;
  if (admin) render();
}

/* ---------- Carregar ---------- */

async function carregar() {
  try {
    const r = await fetch('/api/catalogo');
    if (!r.ok) throw new Error(r.status);
    dados = await r.json();
    const s = dados.settings || {};
    ligarWpp(s.whatsapp);
    ligarInsta(s.instagram);
    mostrarAviso(s.announcement);
    const total = dados.produtos.length;
    const tipos = dados.categorias.filter((c) => dados.produtos.some((p) => p.category_slug === c.slug)).length;
    document.getElementById('cat-resumo').textContent =
      `${total} ${total === 1 ? 'opção' : 'opções'}${tipos > 1 ? ` em ${tipos} tipos de vela` : ''}, feitas à mão em Sinop. Escolha, toque e peça pelo WhatsApp.`;
    renderChips();
    atualizarEnvio();
    render();
    verificarAdmin();
  } catch {
    area.innerHTML = '';
    vazio.hidden = false;
    vazio.innerHTML = 'Não foi possível carregar o catálogo agora. <a href="" onclick="location.reload();return false">Tentar de novo</a>.';
  }
}

carregar();
