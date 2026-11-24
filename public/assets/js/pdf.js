// Gera o catálogo em PDF no próprio navegador (A4, capa + produtos por tipo de vela)
import { preco, precoInfo, fotoUrl, ilustracao, telefoneBonito } from './comum.js';

const COR = {
  vinho: [33, 17, 28],
  tinta: [46, 30, 39],
  suave: [119, 99, 109],
  rosa: [196, 47, 110],
  creme: [251, 247, 244],
  linha: [240, 227, 232],
  branco: [255, 255, 255],
  degrade: [[255, 111, 176], [255, 161, 142], [255, 207, 110]],
};

const A4 = { w: 210, h: 297 };
const M = 14; // margem
const COLS = 3;
const GAP = 6;
const CARD_W = (A4.w - M * 2 - GAP * (COLS - 1)) / COLS;
const PAD = 2.6;
const FOTO_W = CARD_W - PAD * 2;
const FOTO_H = 44;
const CARD_H = FOTO_H + PAD + 31;
const TOPO_CONTEUDO = 26;
const FIM_CONTEUDO = A4.h - 17;

function carregarScript(src) {
  return new Promise((ok, falha) => {
    if (window.jspdf) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.onload = ok;
    s.onerror = () => falha(new Error('Falha ao carregar ' + src));
    document.head.append(s);
  });
}

function carregarImagem(src) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => ok(img);
    img.onerror = falha;
    img.src = src;
  });
}

// Recorta a imagem no formato do card (como object-fit: cover) e devolve JPEG
function recortar(img, w, h, escala = 12) {
  const cw = Math.round(w * escala);
  const ch = Math.round(h * escala);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(cw / iw, ch / ih);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (cw - iw * s) / 2, (ch - ih * s) / 2, iw * s, ih * s);
  return c.toDataURL('image/jpeg', 0.82);
}

async function fotoDoProduto(p) {
  try {
    if (p.images[0]) return recortar(await carregarImagem(fotoUrl(p.images[0])), FOTO_W, FOTO_H);
  } catch { /* usa a ilustração */ }
  const svg = ilustracao(p.slug).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" ');
  const img = await carregarImagem('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  return recortar(img, FOTO_W, FOTO_H);
}

// Texto com espaço normal (o jsPDF não conhece alguns espaços especiais)
const limpo = (s) => String(s ?? '').replace(/[  ]/g, ' ');

function dataHoje() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export async function gerarPdf({ produtos, categorias, settings, titulo, link, origem, progresso = () => {} }) {
  await carregarScript('/assets/vendor/jspdf.umd.min.js');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const fone = telefoneBonito(settings.whatsapp);
  const wppUrl = `https://wa.me/${String(settings.whatsapp || '5566996359962').replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi o catálogo da Sonhos em Velas e quero fazer um pedido.')}`;

  const cor = (c) => doc.setTextColor(...c);
  const preencher = (c) => doc.setFillColor(...c);
  const opacidade = (o) => doc.setGState(new doc.GState({ opacity: o }));

  // Faixa com o degradê do logo (rosa > pêssego > amarelo)
  function faixa(x, y, w, h) {
    const passos = 40;
    for (let i = 0; i < passos; i++) {
      const t = i / (passos - 1);
      const [a, b, u] = t < 0.5 ? [COR.degrade[0], COR.degrade[1], t * 2] : [COR.degrade[1], COR.degrade[2], (t - 0.5) * 2];
      preencher(a.map((v, k) => Math.round(v + (b[k] - v) * u)));
      doc.rect(x + (w / passos) * i, y, w / passos + 0.2, h, 'F');
    }
  }

  let logo = null;
  try {
    const img = await carregarImagem('/assets/img/logo.png');
    const c = document.createElement('canvas');
    c.width = 600; c.height = 600;
    c.getContext('2d').drawImage(img, 0, 0, 600, 600);
    logo = c.toDataURL('image/png');
  } catch { /* sem logo */ }

  /* ---------- Capa ---------- */
  preencher(COR.vinho);
  doc.rect(0, 0, A4.w, A4.h, 'F');
  opacidade(0.22);
  preencher(COR.degrade[0]); doc.circle(150, 60, 95, 'F');
  opacidade(0.14);
  preencher(COR.degrade[2]); doc.circle(60, 230, 90, 'F');
  opacidade(1);

  if (logo) doc.addImage(logo, 'PNG', A4.w / 2 - 34, 52, 68, 68);
  cor(COR.creme);
  doc.setFont('times', 'italic');
  doc.setFontSize(54);
  doc.text('Catálogo', A4.w / 2, 158, { align: 'center' });
  if (titulo) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    cor(COR.degrade[1]);
    doc.text(limpo(titulo).toUpperCase(), A4.w / 2, 172, { align: 'center', charSpace: 1.2 });
  }
  faixa(A4.w / 2 - 25, titulo ? 181 : 170, 50, 1.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12.5);
  cor([255, 217, 230]);
  doc.text('Velas aromáticas artesanais · Sinop, MT', A4.w / 2, titulo ? 194 : 183, { align: 'center' });

  doc.setFontSize(11);
  cor(COR.creme);
  doc.text(`Peça pelo WhatsApp ${fone}`, A4.w / 2, 252, { align: 'center' });
  doc.link(A4.w / 2 - 45, 247, 90, 7, { url: wppUrl });
  doc.setFontSize(9.5);
  cor([200, 175, 188]);
  const linkCurto = link.replace(/^https?:\/\//, '');
  doc.text(`Catálogo online: ${linkCurto}`, A4.w / 2, 260, { align: 'center' });
  doc.link(A4.w / 2 - 60, 256, 120, 6, { url: link });
  doc.text(`Atualizado em ${dataHoje()}`, A4.w / 2, 280, { align: 'center' });

  /* ---------- Páginas de produtos ---------- */
  let pagina = 1;
  function novaPagina() {
    doc.addPage();
    pagina += 1;
    preencher(COR.creme);
    doc.rect(0, 0, A4.w, A4.h, 'F');
    if (logo) doc.addImage(logo, 'PNG', M, 8.5, 10, 10);
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    cor(COR.vinho);
    doc.text('Sonhos em Velas', M + 13, 15.2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    cor(COR.suave);
    doc.text(titulo ? `Catálogo · ${limpo(titulo)}` : 'Catálogo', A4.w - M, 15.2, { align: 'right' });
    faixa(M, 21, A4.w - M * 2, 0.6);

    // rodapé
    doc.setDrawColor(...COR.linha);
    doc.setLineWidth(0.3);
    doc.line(M, A4.h - 13, A4.w - M, A4.h - 13);
    doc.setFontSize(8.5);
    cor(COR.tinta);
    doc.text(`Peça pelo WhatsApp ${fone}`, M, A4.h - 8);
    doc.link(M, A4.h - 11.5, 60, 5, { url: wppUrl });
    cor(COR.suave);
    doc.text(linkCurto, A4.w / 2 + 8, A4.h - 8, { align: 'center' });
    doc.link(A4.w / 2 - 40, A4.h - 11.5, 96, 5, { url: link });
    doc.text(String(pagina), A4.w - M, A4.h - 8, { align: 'right' });
    return TOPO_CONTEUDO + 2;
  }

  // Agrupa por tipo de vela (ou um grupo só, se o catálogo já está filtrado)
  let grupos;
  if (titulo) {
    grupos = [{ name: '', itens: produtos }];
  } else {
    grupos = categorias
      .map((c) => ({ name: c.name, itens: produtos.filter((p) => p.category_slug === c.slug) }))
      .filter((g) => g.itens.length);
    const resto = produtos.filter((p) => !p.category_slug || !categorias.some((c) => c.slug === p.category_slug));
    if (resto.length) grupos.push({ name: grupos.length ? 'Outras velas' : '', itens: resto });
  }

  const total = produtos.length;
  let feitos = 0;
  progresso(0, total);
  let y = novaPagina();

  function card(p, foto, x, yCard) {
    const info = precoInfo(p);
    preencher(COR.branco);
    doc.setDrawColor(...COR.linha);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, yCard, CARD_W, CARD_H, 3, 3, 'FD');
    doc.addImage(foto, 'JPEG', x + PAD, yCard + PAD, FOTO_W, FOTO_H, undefined, 'FAST');

    // selo no canto da foto
    const selo = !p.available ? ['ESGOTADO', COR.vinho, COR.branco]
      : info.desconto ? [`-${info.desconto}%`, COR.rosa, COR.branco] : null;
    if (selo) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const w = doc.getTextWidth(selo[0]) + 4;
      preencher(selo[1]);
      doc.roundedRect(x + PAD + 2, yCard + PAD + 2, w, 5, 2.5, 2.5, 'F');
      cor(selo[2]);
      doc.text(selo[0], x + PAD + 2 + w / 2, yCard + PAD + 5.4, { align: 'center' });
    }

    let ty = yCard + PAD + FOTO_H + 5;
    const tx = x + PAD + 0.6;
    const tw = FOTO_W - 1.2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    cor(COR.tinta);
    const nome = doc.splitTextToSize(limpo(p.name), tw).slice(0, 2);
    doc.text(nome, tx, ty);
    ty += nome.length * 4;

    const detalhe = [p.aroma, p.size].filter(Boolean).join(' · ');
    if (detalhe) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      cor(COR.suave);
      doc.text(doc.splitTextToSize(limpo(detalhe), tw)[0], tx, ty);
    }

    // preço sempre alinhado na base do card
    let py = yCard + CARD_H - 4;
    if (info.parcelas) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      cor(COR.suave);
      doc.text(limpo(info.parcelas), tx, py);
      py -= 4.2;
    }
    if (info.final === null || info.final === undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      cor(COR.rosa);
      doc.text('Sob consulta', tx, py);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      cor(info.de ? COR.rosa : COR.tinta);
      const valor = limpo(preco(info.final));
      doc.text(valor, tx, py);
      if (info.de) {
        const xDe = tx + doc.getTextWidth(valor) + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        cor(COR.suave);
        const de = limpo(preco(info.de));
        doc.text(de, xDe, py);
        doc.setDrawColor(...COR.suave);
        doc.setLineWidth(0.25);
        doc.line(xDe, py - 1.1, xDe + doc.getTextWidth(de), py - 1.1);
      }
    }

    doc.link(x, yCard, CARD_W, CARD_H, { url: `${origem}/p/${encodeURIComponent(p.slug)}` });
  }

  for (const g of grupos) {
    const alturaTitulo = g.name ? 11 : 0;
    if (y + alturaTitulo + CARD_H > FIM_CONTEUDO) y = novaPagina();
    if (g.name) {
      doc.setFont('times', 'italic');
      doc.setFontSize(17);
      cor(COR.vinho);
      doc.text(limpo(g.name), M, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      cor(COR.suave);
      doc.text(`${g.itens.length} ${g.itens.length === 1 ? 'opção' : 'opções'}`, A4.w - M, y + 6, { align: 'right' });
      y += alturaTitulo;
    }
    for (let i = 0; i < g.itens.length; i += COLS) {
      if (y + CARD_H > FIM_CONTEUDO) y = novaPagina();
      const linha = g.itens.slice(i, i + COLS);
      for (let j = 0; j < linha.length; j++) {
        const foto = await fotoDoProduto(linha[j]);
        card(linha[j], foto, M + j * (CARD_W + GAP), y);
        feitos += 1;
        progresso(feitos, total);
      }
      y += CARD_H + GAP;
    }
    y += 3;
  }

  const sufixo = titulo ? '-' + titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
  doc.setProperties({ title: `Catálogo Sonhos em Velas${titulo ? ' · ' + titulo : ''}`, author: 'Sonhos em Velas' });
  doc.save(`catalogo-sonhos-em-velas${sufixo}.pdf`);
}
