// Página inicial: carrega o catálogo, filtros e busca
import { cardProduto, efeitos, ligarWpp, ligarInsta, mostrarAviso, normalizar, esc } from './comum.js';

const grade = document.getElementById('grade');
const chips = document.getElementById('chips');
const busca = document.getElementById('busca');
const vazio = document.getElementById('vazio');

let produtos = [];
let categoriaAtual = new URLSearchParams(location.search).get('categoria') || '';

efeitos();
ligarWpp();

function render() {
  const termo = normalizar(busca.value.trim());
  const lista = produtos.filter((p) => {
    if (categoriaAtual && p.category_slug !== categoriaAtual) return false;
    if (!termo) return true;
    return normalizar(`${p.name} ${p.aroma} ${p.description} ${p.category_name || ''}`).includes(termo);
  });
  grade.innerHTML = lista.map(cardProduto).join('');
  vazio.hidden = lista.length > 0;
}

function renderChips(categorias) {
  const comProdutos = categorias
    .map((c) => ({ ...c, total: produtos.filter((p) => p.category_slug === c.slug).length }))
    .filter((c) => c.total > 0);
  if (categoriaAtual && !comProdutos.some((c) => c.slug === categoriaAtual)) categoriaAtual = '';
  const itens = [{ slug: '', name: 'Todos', total: produtos.length }, ...comProdutos];
  chips.innerHTML = itens
    .map((c) => `<button type="button" class="chip" role="tab" data-slug="${esc(c.slug)}" aria-selected="${c.slug === categoriaAtual}">${esc(c.name)}<small>${c.total}</small></button>`)
    .join('');
  chips.hidden = comProdutos.length < 2;
}

chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  categoriaAtual = b.dataset.slug;
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-selected', String(c === b)));
  const url = new URL(location.href);
  if (categoriaAtual) url.searchParams.set('categoria', categoriaAtual); else url.searchParams.delete('categoria');
  history.replaceState(null, '', url);
  render();
});

let t;
busca.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 120); });

async function carregar() {
  try {
    const r = await fetch('/api/catalogo');
    if (!r.ok) throw new Error(r.status);
    const dados = await r.json();
    produtos = dados.produtos;
    const s = dados.settings || {};
    ligarWpp(s.whatsapp);
    ligarInsta(s.instagram);
    mostrarAviso(s.announcement);
    const sobre = document.getElementById('sobre-texto');
    if (sobre) sobre.textContent = s.about || '';
    renderChips(dados.categorias);
    render();
  } catch (err) {
    grade.innerHTML = '';
    vazio.hidden = false;
    vazio.innerHTML = 'Não foi possível carregar o catálogo agora. <a href="" onclick="location.reload();return false">Tentar de novo</a>.';
  }
}

carregar();
