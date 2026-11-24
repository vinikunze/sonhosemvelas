// Gera o SQL que define (ou redefine) o usuário e a senha do painel.
// Uso:
//   node scripts/definir-acesso.mjs <usuario> <senha> > /tmp/acesso.sql
//   npx wrangler d1 execute sonhosemvelas --local --file /tmp/acesso.sql    (no computador)
//   npx wrangler d1 execute sonhosemvelas --remote --file /tmp/acesso.sql   (no site publicado)
// A senha nunca é gravada: só o hash PBKDF2.
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const [usuario, senha] = process.argv.slice(2);
if (!usuario || !senha) {
  console.error('Uso: node scripts/definir-acesso.mjs <usuario> <senha>');
  process.exit(1);
}
const ITERACOES = 100000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(senha, salt, ITERACOES, 32, 'sha256').toString('base64');
const segredo = randomBytes(32).toString('base64');
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
console.log(
  `INSERT OR REPLACE INTO admin (id, username, pass_hash, pass_salt, iterations, session_secret, updated_at) VALUES (1, ${q(usuario.trim())}, ${q(hash)}, ${q(salt.toString('base64'))}, ${ITERACOES}, ${q(segredo)}, datetime('now'));`,
);
