// Painel da loja: login, produtos (com fotos), categorias e ajustes

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const fotoUrl = (k) => `/fotos/${encodeURIComponent(k)}`;
const precoTexto = (c) => (c === null || c === undefined ? 'Sob consulta' : (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));

const MAX_FOTOS = 12;
const LADO_MAX = 1600;

let estado = { produtos: [], categorias: [], settings: {} };

/* ---------------- Comunicação com o servidor ---------------- */

class ErroApi extends Error {}

async function api(caminho, { metodo = 'GET', corpo, tipo } = {}) {
  const headers = { 'x-sev': '1' };
  let body;
  if (corpo instanceof Blob) { body = corpo; headers['content-type'] = tipo || corpo.type; }
  else if (corpo !== undefined) { body = JSON.stringify(corpo); headers['content-type'] = 'application/json'; }
  let r;
  try {
    r = await fetch(caminho, { method: metodo, headers, body, credentials: 'same-origin' });
  } catch {
    throw new ErroApi('Sem conexão. Verifique a internet e tente de novo.');
  }
  let dados = {};
  try { dados = await r.json(); } catch { /* sem corpo */ }
  if (r.status === 401 && caminho !== '/api/admin/login') { mostrarLogin(); throw new ErroApi('Sua sessão expirou. Entre de novo.'); }
  if (!r.ok) throw new ErroApi(dados.erro || 'Algo deu errado. Tente de novo.');
  return dados;
}

function toast(msg, erro = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('is-erro', erro);
  t.classList.add('is-visivel');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('is-visivel'), erro ? 4000 : 2200);
}

/* ---------------- Login ---------------- */

function mostrarLogin() {
  $('#app').hidden = true;
  $('#tela-login').hidden = false;
  if ($('#editor').open) $('#editor').close();
  setTimeout(() => ($('#usuario').value ? $('#senha') : $('#usuario')).focus(), 50);
}

async function entrarNoPainel() {
  $('#tela-login').hidden = true;
  $('#app').hidden = false;
  await carregar();
}

$('#ver-senha').addEventListener('click', () => {
  const i = $('#senha');
  const ver = i.type === 'password';
  i.type = ver ? 'text' : 'password';
  $('#ver-senha').textContent = ver ? 'Ocultar' : 'Mostrar';
});

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const botao = e.submitter || $('#form-login button[type=submit]');
  botao.disabled = true;
  $('#erro-login').textContent = '';
  try {
    await api('/api/admin/login', { metodo: 'POST', corpo: { usuario: $('#usuario').value, senha: $('#senha').value } });
    $('#senha').value = '';
    await entrarNoPainel();
  } catch (err) {
    $('#erro-login').textContent = err.message;
  } finally {
    botao.disabled = false;
  }
});

$('#sair').addEventListener('click', async () => {
  try { await api('/api/admin/logout', { metodo: 'POST' }); } catch { /* ignora */ }
  mostrarLogin();
});

/* ---------------- Navegação entre abas ---------------- */

function irPara(aba) {
  document.querySelectorAll('.aba').forEach((s) => (s.hidden = s.dataset.aba !== aba));
  document.querySelectorAll('.abas button').forEach((b) => {
    if (b.dataset.ir === aba) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => irPara(b.dataset.ir)));

/* ---------------- Carregar dados ---------------- */

async function carregar() {
  try {
    estado = await api('/api/admin/dados');
    renderProdutos();
    renderCategorias();
    preencherAjustes();
  } catch (err) {
    toast(err.message, true);
  }
}

/* ---------------- Produtos ---------------- */

function renderProdutos() {
  const termo = normalizar($('#busca').value.trim());
  const lista = estado.produtos.filter((p) => !termo || normalizar(`${p.name} ${p.aroma} ${p.category_name || ''}`).includes(termo));
  const total = estado.produtos.length;
  const visiveis = estado.produtos.filter((p) => p.visible).length;
  $('#contagem').textContent = total ? `${total} produto${total > 1 ? 's' : ''} · ${visiveis} no site` : '';
  $('#sem-produtos').hidden = total > 0;

  $('#lista-produtos').innerHTML = lista.map((p) => {
    const foto = p.images[0]
      ? `<img class="item__foto" src="${fotoUrl(p.images[0])}" alt="" loading="lazy">`
      : '<span class="item__foto" aria-hidden="true">🕯️</span>';
    const tags = [
      !p.visible && '<span class="tag tag--off">Escondido</span>',
      !p.available && '<span class="tag tag--esgotado">Esgotado</span>',
      p.featured && '<span class="tag">Destaque</span>',
      !p.images.length && '<span class="tag tag--off">Sem foto</span>',
    ].filter(Boolean).join('');
    return `<li class="item" data-id="${esc(p.id)}">
      <button type="button" class="item__abrir" data-editar="${esc(p.id)}" aria-label="Editar ${esc(p.name)}">
        ${foto}
        <span class="item__texto">
          <span class="item__nome">${esc(p.name)}</span>
          <span class="item__meta">${esc(precoTexto(p.price_cents))}${p.category_name ? ' · ' + esc(p.category_name) : ''}</span>
          ${tags ? `<span class="item__tags">${tags}</span>` : ''}
        </span>
      </button>
      <label class="item__sw">
        <input type="checkbox" class="sw" data-disponivel="${esc(p.id)}" ${p.available ? 'checked' : ''} aria-label="Disponível">
        Disponível
      </label>
    </li>`;
  }).join('');
}

$('#busca').addEventListener('input', renderProdutos);

$('#lista-produtos').addEventListener('click', (e) => {
  const b = e.target.closest('[data-editar]');
  if (b) abrirEditor(estado.produtos.find((p) => p.id === b.dataset.editar));
});

$('#lista-produtos').addEventListener('change', async (e) => {
  const sw = e.target.closest('[data-disponivel]');
  if (!sw) return;
  sw.disabled = true;
  try {
    const { produto } = await api(`/api/admin/produtos/${sw.dataset.disponivel}`, { metodo: 'PATCH', corpo: { available: sw.checked } });
    substituirProduto(produto);
    toast(produto.available ? 'Marcado como disponível' : 'Marcado como esgotado');
  } catch (err) {
    sw.checked = !sw.checked;
    toast(err.message, true);
  } finally {
    sw.disabled = false;
  }
});

function substituirProduto(p) {
  const i = estado.produtos.findIndex((x) => x.id === p.id);
  if (i >= 0) estado.produtos[i] = p; else estado.produtos.unshift(p);
  renderProdutos();
}

$('#novo-produto').addEventListener('click', () => abrirEditor(null));

/* ---------------- Editor de produto ---------------- */

const editor = $('#editor');
const form = $('#form-produto');
let editando = null;      // produto original (ou null se novo)
let fotos = [];           // [{ key, url, enviando, erro }]
let enviadasAgora = [];   // chaves enviadas nesta edição (para limpar se cancelar)
let alterado = false;

function opcoesCategoria(selecionada) {
  $('#select-categoria').innerHTML = [
    '<option value="">Sem categoria</option>',
    ...estado.categorias.map((c) => `<option value="${esc(c.id)}" ${c.id === selecionada ? 'selected' : ''}>${esc(c.name)}</option>`),
    '<option value="__nova">+ Nova categoria...</option>',
  ].join('');
}

function abrirEditor(p) {
  editando = p;
  enviadasAgora = [];
  alterado = false;
  form.reset();
  $('#erro-produto').textContent = '';
  $('#editor-titulo').textContent = p ? 'Editar produto' : 'Novo produto';
  $('#apagar-produto').hidden = !p;
  opcoesCategoria(p?.category_id || '');

  form.name.value = p?.name || '';
  form.price.value = p && p.price_cents !== null ? (p.price_cents / 100).toFixed(2).replace('.', ',') : '';
  form.aroma.value = p?.aroma || '';
  form.size.value = p?.size || '';
  form.description.value = p?.description || '';
  form.available.checked = p ? p.available : true;
  form.featured.checked = p ? p.featured : false;
  form.visible.checked = p ? p.visible : true;
  fotos = (p?.images || []).map((key) => ({ key, url: fotoUrl(key) }));
  renderFotos();

  editor.showModal();
  editor.scrollTop = 0;
  if (!p) setTimeout(() => form.name.focus(), 80);
}

form.addEventListener('input', () => (alterado = true));

$('#select-categoria').addEventListener('change', async (e) => {
  if (e.target.value !== '__nova') return;
  const nome = prompt('Nome da nova categoria:');
  if (!nome || !nome.trim()) { e.target.value = ''; return; }
  try {
    const { categoria } = await api('/api/admin/categorias', { metodo: 'POST', corpo: { name: nome.trim() } });
    estado.categorias.push(categoria);
    opcoesCategoria(categoria.id);
    renderCategorias();
  } catch (err) {
    e.target.value = '';
    toast(err.message, true);
  }
});

function renderFotos() {
  const ul = $('#fotos');
  ul.innerHTML = fotos.map((f, i) => `
    <li class="foto${f.enviando ? ' foto--enviando' : ''}${f.erro ? ' foto--erro' : ''}">
      <img src="${esc(f.url)}" alt="Foto ${i + 1}">
      ${i === 0 ? '<span class="foto__capa">Capa</span>' : ''}
      <div class="foto__acoes">
        <button type="button" data-mover="-1" data-i="${i}" aria-label="Mover para trás" ${i === 0 ? 'disabled' : ''}>‹</button>
        <button type="button" class="remover" data-remover="${i}" aria-label="Remover foto">✕</button>
        <button type="button" data-mover="1" data-i="${i}" aria-label="Mover para frente" ${i === fotos.length - 1 ? 'disabled' : ''}>›</button>
      </div>
    </li>`).join('') + (fotos.length < MAX_FOTOS ? `
    <li><button type="button" class="foto-add" id="add-foto">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
      Adicionar
    </button></li>` : '');
}

$('#fotos').addEventListener('click', (e) => {
  if (e.target.closest('#add-foto')) { $('#input-fotos').click(); return; }
  const rem = e.target.closest('[data-remover]');
  if (rem) {
    const [f] = fotos.splice(Number(rem.dataset.remover), 1);
    if (f?.url?.startsWith('blob:')) URL.revokeObjectURL(f.url);
    alterado = true;
    renderFotos();
    return;
  }
  const mov = e.target.closest('[data-mover]');
  if (mov) {
    const i = Number(mov.dataset.i);
    const j = i + Number(mov.dataset.mover);
    if (j < 0 || j >= fotos.length) return;
    [fotos[i], fotos[j]] = [fotos[j], fotos[i]];
    alterado = true;
    renderFotos();
  }
});

// Reduz a foto no próprio celular antes de enviar (fica leve e rápida no site)
async function prepararFoto(arquivo) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    const img = new Image();
    img.src = URL.createObjectURL(arquivo);
    await img.decode();
    bitmap = img;
  }
  const w = bitmap.width, h = bitmap.height;
  const escala = Math.min(1, LADO_MAX / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * escala);
  canvas.height = Math.round(h * escala);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const gerar = (tipo, q) => new Promise((ok) => canvas.toBlob(ok, tipo, q));
  let blob = await gerar('image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await gerar('image/jpeg', 0.85);
  return blob;
}

$('#input-fotos').addEventListener('change', async (e) => {
  const arquivos = [...e.target.files].slice(0, MAX_FOTOS - fotos.length);
  e.target.value = '';
  if (!arquivos.length) return;
  alterado = true;

  const novas = arquivos.map((a) => ({ arquivo: a, url: URL.createObjectURL(a), enviando: true }));
  fotos.push(...novas);
  renderFotos();

  // Envia uma por vez para não travar celulares mais simples
  for (const f of novas) {
    try {
      const blob = await prepararFoto(f.arquivo);
      const { key } = await api('/api/admin/fotos', { metodo: 'POST', corpo: blob, tipo: blob.type });
      f.key = key;
      enviadasAgora.push(key);
    } catch (err) {
      f.erro = true;
      toast(err instanceof ErroApi ? err.message : 'Não foi possível usar essa foto. Tente outra.', true);
    } finally {
      f.enviando = false;
      delete f.arquivo;
      renderFotos();
    }
  }
  // Tira da lista as que falharam
  const falhas = fotos.filter((f) => f.erro);
  if (falhas.length) {
    setTimeout(() => {
      fotos = fotos.filter((f) => !f.erro);
      falhas.forEach((f) => f.url.startsWith('blob:') && URL.revokeObjectURL(f.url));
      renderFotos();
    }, 1800);
  }
});

function lerPreco(txt) {
  const limpo = String(txt || '').replace(/[R$\s]/g, '');
  if (!limpo) return null;
  // aceita "49,90", "49.90", "1.249,90"
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  const n = Number(normal);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const erro = $('#erro-produto');
  erro.textContent = '';

  if (!form.name.value.trim()) { erro.textContent = 'Dê um nome ao produto.'; form.name.focus(); return; }
  const price_cents = lerPreco(form.price.value);
  if (Number.isNaN(price_cents)) { erro.textContent = 'Preço inválido. Exemplo: 49,90'; form.price.focus(); return; }
  if (fotos.some((f) => f.enviando)) { erro.textContent = 'Espere as fotos terminarem de enviar.'; return; }

  const dados = {
    name: form.name.value.trim(),
    price_cents,
    category_id: form.category_id.value && form.category_id.value !== '__nova' ? form.category_id.value : null,
    aroma: form.aroma.value.trim(),
    size: form.size.value.trim(),
    description: form.description.value.trim(),
    images: fotos.filter((f) => f.key).map((f) => f.key),
    available: form.available.checked,
    featured: form.featured.checked,
    visible: form.visible.checked,
  };

  const botoes = form.querySelectorAll('button[type=submit]');
  botoes.forEach((b) => (b.disabled = true));
  try {
    const { produto } = editando
      ? await api(`/api/admin/produtos/${editando.id}`, { metodo: 'PUT', corpo: dados })
      : await api('/api/admin/produtos', { metodo: 'POST', corpo: dados });
    // Fotos enviadas e depois removidas antes de salvar: apaga do armazenamento
    enviadasAgora
      .filter((k) => !dados.images.includes(k))
      .forEach((k) => api(`/api/admin/fotos/${encodeURIComponent(k)}`, { metodo: 'DELETE' }).catch(() => {}));
    enviadasAgora = [];
    alterado = false;
    substituirProduto(produto);
    // atualiza contagem das categorias
    estado = await api('/api/admin/dados');
    renderProdutos();
    renderCategorias();
    editor.close();
    toast(editando ? 'Produto atualizado!' : 'Produto cadastrado!');
  } catch (err) {
    erro.textContent = err.message;
  } finally {
    botoes.forEach((b) => (b.disabled = false));
  }
});

async function fecharEditor() {
  if (alterado && !confirm('Sair sem salvar as alterações?')) return;
  // Apaga fotos enviadas que não foram salvas em nenhum produto
  const descartar = enviadasAgora.slice();
  enviadasAgora = [];
  editor.close();
  for (const key of descartar) {
    api(`/api/admin/fotos/${encodeURIComponent(key)}`, { metodo: 'DELETE' }).catch(() => {});
  }
}

$('#fechar-editor').addEventListener('click', fecharEditor);
editor.addEventListener('cancel', (e) => { e.preventDefault(); fecharEditor(); });

$('#apagar-produto').addEventListener('click', async () => {
  if (!editando) return;
  if (!confirm(`Apagar "${editando.name}" de vez? As fotos também serão apagadas.`)) return;
  try {
    await api(`/api/admin/produtos/${editando.id}`, { metodo: 'DELETE' });
    estado.produtos = estado.produtos.filter((p) => p.id !== editando.id);
    alterado = false;
    enviadasAgora.forEach((key) => api(`/api/admin/fotos/${encodeURIComponent(key)}`, { metodo: 'DELETE' }).catch(() => {}));
    enviadasAgora = [];
    editor.close();
    renderProdutos();
    toast('Produto apagado');
  } catch (err) {
    toast(err.message, true);
  }
});

window.addEventListener('beforeunload', (e) => {
  if (editor.open && alterado) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------------- Categorias ---------------- */

const ICONE = {
  cima: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  baixo: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  editar: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  apagar: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function renderCategorias() {
  const cs = estado.categorias;
  $('#lista-categorias').innerHTML = cs.length
    ? cs.map((c, i) => `
      <li class="cat">
        <div class="cat__nome"><strong>${esc(c.name)}</strong><small>${c.total ?? 0} produto${(c.total ?? 0) === 1 ? '' : 's'}</small></div>
        <button type="button" class="icone" data-cat-mover="-1" data-i="${i}" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICONE.cima}</button>
        <button type="button" class="icone" data-cat-mover="1" data-i="${i}" aria-label="Descer" ${i === cs.length - 1 ? 'disabled' : ''}>${ICONE.baixo}</button>
        <button type="button" class="icone" data-cat-editar="${esc(c.id)}" aria-label="Renomear">${ICONE.editar}</button>
        <button type="button" class="icone icone--perigo" data-cat-apagar="${esc(c.id)}" aria-label="Apagar">${ICONE.apagar}</button>
      </li>`).join('')
    : '<p class="vazio">Nenhuma categoria ainda.</p>';
}

$('#form-categoria').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $('#nova-categoria');
  const name = input.value.trim();
  if (!name) return;
  try {
    const { categoria } = await api('/api/admin/categorias', { metodo: 'POST', corpo: { name } });
    estado.categorias.push(categoria);
    input.value = '';
    renderCategorias();
    toast('Categoria criada');
  } catch (err) {
    toast(err.message, true);
  }
});

$('#lista-categorias').addEventListener('click', async (e) => {
  const mover = e.target.closest('[data-cat-mover]');
  const editar = e.target.closest('[data-cat-editar]');
  const apagar = e.target.closest('[data-cat-apagar]');
  try {
    if (mover) {
      const i = Number(mover.dataset.i);
      const j = i + Number(mover.dataset.catMover);
      const cs = estado.categorias;
      [cs[i], cs[j]] = [cs[j], cs[i]];
      renderCategorias();
      await api('/api/admin/ordem', { metodo: 'PUT', corpo: { tipo: 'categorias', ids: cs.map((c) => c.id) } });
    } else if (editar) {
      const c = estado.categorias.find((x) => x.id === editar.dataset.catEditar);
      const nome = prompt('Novo nome da categoria:', c.name);
      if (!nome || !nome.trim() || nome.trim() === c.name) return;
      await api(`/api/admin/categorias/${c.id}`, { metodo: 'PUT', corpo: { name: nome.trim() } });
      await carregar();
      toast('Categoria renomeada');
    } else if (apagar) {
      const c = estado.categorias.find((x) => x.id === apagar.dataset.catApagar);
      const aviso = c.total ? `\n\nOs ${c.total} produto(s) dela continuam no site, só ficam sem categoria.` : '';
      if (!confirm(`Apagar a categoria "${c.name}"?${aviso}`)) return;
      await api(`/api/admin/categorias/${c.id}`, { metodo: 'DELETE' });
      await carregar();
      toast('Categoria apagada');
    }
  } catch (err) {
    toast(err.message, true);
    carregar();
  }
});

/* ---------------- Ajustes ---------------- */

function preencherAjustes() {
  const f = $('#form-ajustes');
  const s = estado.settings || {};
  f.whatsapp.value = s.whatsapp || '';
  f.instagram.value = s.instagram || '';
  f.announcement.value = s.announcement || '';
  f.about.value = s.about || '';
}

$('#form-ajustes').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const botao = f.querySelector('button[type=submit]');
  botao.disabled = true;
  try {
    const corpo = { whatsapp: f.whatsapp.value, instagram: f.instagram.value, announcement: f.announcement.value, about: f.about.value };
    await api('/api/admin/config', { metodo: 'PUT', corpo });
    estado.settings = { ...corpo, whatsapp: corpo.whatsapp.replace(/\D/g, '') };
    toast('Ajustes salvos!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    botao.disabled = false;
  }
});

$('#form-senha').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.nova.value !== f.repetir.value) { toast('As duas senhas novas não são iguais', true); return; }
  const botao = f.querySelector('button[type=submit]');
  botao.disabled = true;
  try {
    await api('/api/admin/senha', { metodo: 'PUT', corpo: { atual: f.atual.value, nova: f.nova.value } });
    f.reset();
    toast('Senha trocada!');
  } catch (err) {
    toast(err.message, true);
  } finally {
    botao.disabled = false;
  }
});

/* ---------------- Início ---------------- */

(async () => {
  try {
    const { logado } = await api('/api/admin/sessao');
    if (logado) await entrarNoPainel(); else mostrarLogin();
  } catch (err) {
    mostrarLogin();
    $('#erro-login').textContent = err.message;
  }
})();
