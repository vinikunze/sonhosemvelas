// Acesso ao painel: usuário e senha guardados na tabela "admin" do banco.
// A senha fica como hash PBKDF2-SHA256; a sessão é um cookie assinado com HMAC.
// Para definir o acesso: node scripts/definir-acesso.mjs <usuario> <senha>

const COOKIE = 'sev_sessao';
const DURACAO_S = 60 * 60 * 24 * 30; // 30 dias
export const ITERACOES = 100000; // máximo aceito pelo PBKDF2 dos Workers

const enc = new TextEncoder();

function b64(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}
function b64url(buf) {
  return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deB64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function hmac(chave, texto) {
  const k = await crypto.subtle.importKey('raw', enc.encode(chave), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', k, enc.encode(texto)));
}

// Comparação em tempo constante (compara HMACs dos dois valores)
export async function iguais(a, b) {
  const chave = 'comparacao';
  const [ha, hb] = await Promise.all([hmac(chave, String(a)), hmac(chave, String(b))]);
  let diff = ha.length ^ hb.length;
  for (let i = 0; i < Math.min(ha.length, hb.length); i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

export function normalizarUsuario(u) {
  return String(u || '').trim().toLowerCase();
}

export async function hashSenha(senha, saltB64, iteracoes = ITERACOES) {
  const base = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: deB64(saltB64), iterations: iteracoes },
    base,
    256,
  );
  return b64(bits);
}

export function aleatorio(bytes = 32) {
  return b64(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function lerAdmin(env) {
  return env.DB.prepare('SELECT * FROM admin WHERE id = 1').first();
}

export async function conferirSenha(admin, senha) {
  if (!admin) return false;
  const h = await hashSenha(senha, admin.pass_salt, admin.iterations);
  return iguais(h, admin.pass_hash);
}

// A chave da sessão depende do hash da senha: trocar a senha derruba as sessões antigas
function chaveSessao(admin) {
  return `${admin.session_secret}|${admin.pass_hash}`;
}

function cookie(request, valor, maxAge) {
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${valor}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${seguro}`;
}

export async function criarCookie(admin, request) {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_S;
  const payload = `v1.${exp}`;
  return cookie(request, `${payload}.${await hmac(chaveSessao(admin), payload)}`, DURACAO_S);
}

export function apagarCookie(request) {
  return cookie(request, '', 0);
}

// Cookie visível ao JavaScript que só diz "esta pessoa costuma ser a administradora".
// Não dá acesso a nada: serve para o catálogo mostrar os botões de edição sem consultar o servidor à toa.
export function cookieDica(request, ligado) {
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `sev_adm=${ligado ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${ligado ? DURACAO_S : 0}${seguro}`;
}

export async function sessaoValida(env, request, admin) {
  admin = admin ?? (await lerAdmin(env));
  if (!admin) return false;
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const partes = m[1].split('.');
  if (partes.length !== 3 || partes[0] !== 'v1') return false;
  const exp = Number(partes[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return iguais(await hmac(chaveSessao(admin), `v1.${exp}`), partes[2]);
}
