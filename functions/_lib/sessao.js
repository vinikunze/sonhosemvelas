// Sessão do painel: cookie assinado com HMAC-SHA256
// Segredos necessários (Cloudflare > Pages > Configurações > Variáveis):
//   ADMIN_USER      usuário do painel
//   ADMIN_PASSWORD  senha do painel
//   SESSION_SECRET  texto aleatório longo para assinar o cookie

const COOKIE = 'sev_sessao';
const DURACAO_S = 60 * 60 * 24 * 30; // 30 dias

const enc = new TextEncoder();

function b64url(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function chave(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function assinar(secret, texto) {
  const k = await chave(secret);
  return b64url(await crypto.subtle.sign('HMAC', k, enc.encode(texto)));
}

// Comparação em tempo constante via HMAC dos dois lados
export async function iguais(a, b, secret) {
  const [ha, hb] = await Promise.all([assinar(secret, 'cmp:' + a), assinar(secret, 'cmp:' + b)]);
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

// Usuário e senha entram na chave: trocar qualquer um derruba as sessões antigas
function chaveSessao(env) {
  return `${env.SESSION_SECRET}|${normalizarUsuario(env.ADMIN_USER)}|${env.ADMIN_PASSWORD}`;
}

export function normalizarUsuario(u) {
  return String(u || '').trim().toLowerCase();
}

export function configurado(env) {
  return !!(env.ADMIN_USER && env.ADMIN_PASSWORD && env.SESSION_SECRET && env.SESSION_SECRET.length >= 16);
}

export async function criarCookie(env, request) {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_S;
  const payload = `v1.${exp}`;
  const sig = await assinar(chaveSessao(env), payload);
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DURACAO_S}${seguro}`;
}

export function apagarCookie(request) {
  const seguro = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${seguro}`;
}

export async function sessaoValida(env, request) {
  if (!configurado(env)) return false;
  const cookies = request.headers.get('cookie') || '';
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const partes = m[1].split('.');
  if (partes.length !== 3 || partes[0] !== 'v1') return false;
  const exp = Number(partes[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  const esperado = await assinar(chaveSessao(env), `v1.${exp}`);
  return iguais(esperado, partes[2], env.SESSION_SECRET);
}
