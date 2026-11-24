// Ponto de entrada do Worker: direciona cada endereço para a função certa.
// As funções ficam em functions/ (cada arquivo exporta onRequestGet, onRequestPost etc.).
// O que não for rota do servidor é entregue como arquivo estático de public/.

import * as catalogo from '../functions/api/catalogo.js';
import * as produtoPublico from '../functions/api/produtos/[slug].js';
import * as fotoPublica from '../functions/fotos/[key].js';
import * as paginaProduto from '../functions/p/[slug].js';
import * as raiz from '../functions/_middleware.js';

import * as adminMiddleware from '../functions/api/admin/_middleware.js';
import * as login from '../functions/api/admin/login.js';
import * as logout from '../functions/api/admin/logout.js';
import * as sessao from '../functions/api/admin/sessao.js';
import * as senha from '../functions/api/admin/senha.js';
import * as dados from '../functions/api/admin/dados.js';
import * as config from '../functions/api/admin/config.js';
import * as ordem from '../functions/api/admin/ordem.js';
import * as categorias from '../functions/api/admin/categorias.js';
import * as categoria from '../functions/api/admin/categorias/[id].js';
import * as produtos from '../functions/api/admin/produtos.js';
import * as produto from '../functions/api/admin/produtos/[id].js';
import * as fotos from '../functions/api/admin/fotos.js';
import * as foto from '../functions/api/admin/fotos/[key].js';

const ROTAS = [
  ['/api/catalogo', catalogo],
  ['/api/produtos/:slug', produtoPublico],
  ['/fotos/:key', fotoPublica],
  ['/p/:slug', paginaProduto],
  ['/api/admin/login', login],
  ['/api/admin/logout', logout],
  ['/api/admin/sessao', sessao],
  ['/api/admin/senha', senha],
  ['/api/admin/dados', dados],
  ['/api/admin/config', config],
  ['/api/admin/ordem', ordem],
  ['/api/admin/categorias', categorias],
  ['/api/admin/categorias/:id', categoria],
  ['/api/admin/produtos', produtos],
  ['/api/admin/produtos/:id', produto],
  ['/api/admin/fotos', fotos],
  ['/api/admin/fotos/:key', foto],
].map(([padrao, modulo]) => {
  const nomes = [];
  const re = new RegExp('^' + padrao.replace(/:([a-z]+)/g, (_, n) => { nomes.push(n); return '([^/]+)'; }) + '/?$');
  return { re, nomes, modulo };
});

function encontrar(pathname) {
  for (const r of ROTAS) {
    const m = pathname.match(r.re);
    if (m) {
      const params = {};
      r.nomes.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1]); });
      return { modulo: r.modulo, params };
    }
  }
  return null;
}

function handlerDo(modulo, metodo) {
  const nome = 'onRequest' + metodo.charAt(0) + metodo.slice(1).toLowerCase();
  if (modulo[nome]) return modulo[nome];
  if (metodo === 'HEAD' && modulo.onRequestGet) return modulo.onRequestGet;
  return modulo.onRequest || null;
}

// Executa uma lista de middlewares e, no fim, o handler (mesmo formato do Pages Functions)
function cadeia(etapas, base) {
  let i = 0;
  const next = async () => {
    const etapa = etapas[i++];
    return etapa({ ...base, next });
  };
  return next();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const base = { request, env, params: {}, waitUntil: ctx.waitUntil.bind(ctx), data: {} };

    const rota = encontrar(url.pathname);
    let final;
    if (rota) {
      const h = handlerDo(rota.modulo, request.method);
      final = h
        ? (c) => h({ ...c, params: rota.params })
        : () => new Response('Método não permitido', { status: 405 });
    } else if (url.pathname.startsWith('/api/')) {
      final = () => new Response(JSON.stringify({ erro: 'Não encontrado' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
    } else {
      final = () => env.ASSETS.fetch(request);
    }

    const etapas = [raiz.onRequest];
    if (url.pathname.startsWith('/api/admin/')) etapas.push(adminMiddleware.onRequest);
    etapas.push(final);

    try {
      return await cadeia(etapas, base);
    } catch (err) {
      console.error(err);
      return new Response(JSON.stringify({ erro: 'Erro inesperado. Tente de novo.' }), { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
  },
};
