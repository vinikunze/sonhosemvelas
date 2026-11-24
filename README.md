# Sonhos em Velas

Loja online da Sonhos em Velas (velas aromáticas artesanais, Sinop, MT). Visual claro e suave (lilás, rosa e creme, fontes Fraunces e Plus Jakarta Sans), com sacola e fechamento do pedido pelo WhatsApp.

- **Site de apresentação** (`/`): topo com foto de capa (ou vela animada), coleções numeradas, nossa essência, destaques da semana, coleções em imagem, momentos de uso, galeria do ateliê, personalizadas, como pedir e contato. Menu em tela cheia no celular.
- **Catálogo / loja** (`/catalogo`): abas por coleção, gaveta de filtros (busca, momento, ordenação, promoções), botão "+" para colocar na sacola, enviar catálogo no WhatsApp, copiar link e baixar PDF. Filtros viram link (`?categoria=`, `?momento=`).
- **Página da vela** (`/p/nome`): galeria, preço com desconto e parcelas, peso, aroma, tempo de queima, pedido mínimo, quantidade, "Adicionar à sacola", detalhes (sobre, do que é feita, ideal para, cuidados, entrega).
- **Sacola**: guarda os itens no aparelho da cliente; "Finalizar pelo WhatsApp" envia a lista, quantidades, total, nome, entrega/retirada e observação.
- **Painel** (`/admin`): produtos (fotos, tipo, preços, parcelas, peso, aroma, queima, composição, momentos de uso, pedido mínimo), categorias, página inicial (destaques e fotos do site: capa, "nossa essência" e galeria) e ajustes.

## Como funciona

Tudo roda na Cloudflare, no plano gratuito:

| Parte | Serviço | Onde está no código |
|---|---|---|
| Páginas do site | Cloudflare Workers (arquivos estáticos) | `public/` |
| API e páginas de produto | Worker | `src/worker.js` (rotas) e `functions/` (cada rota) |
| Produtos, categorias, ajustes, acesso ao painel | D1 (banco SQLite) | `migrations/` |
| Fotos | KV | enviadas pelo painel, servidas em `/fotos/...` |
| PDF do catálogo | jsPDF (`public/assets/vendor/`) | `public/assets/js/pdf.js` |

Não há etapa de build: HTML, CSS e JavaScript puros. O `wrangler.jsonc` já aponta para o banco D1 e o KV de produção.

## Rodar no computador

```bash
npm install
```

```bash
npm run db:local
```

```bash
node scripts/definir-acesso.mjs teste teste123 > /tmp/acesso.sql
```

```bash
npx wrangler d1 execute sonhosemvelas --local --file /tmp/acesso.sql
```

```bash
npm run dev
```

Abra http://localhost:8787 (site) e http://localhost:8787/admin (painel, usuário `teste`, senha `teste123`).

## Publicar

O Worker `sonhosemvelas` na Cloudflare é ligado ao repositório do GitHub: cada push na branch `main` publica o site sozinho.
Configuração na Cloudflare: build command `exit 0`, deploy command `npx wrangler deploy`.

Mudanças no banco (novas migrations) precisam ser aplicadas à parte:

```bash
npm run db:remote
```

## Acesso ao painel

Usuário e senha ficam na tabela `admin` do banco, com a senha guardada como hash PBKDF2 (nunca em texto puro).
A própria dona da loja troca a senha em **Painel > Ajustes > Trocar senha**.

Se esquecer a senha, gere um acesso novo e aplique no banco de produção:

```bash
node scripts/definir-acesso.mjs Usuario NovaSenha > /tmp/acesso.sql
```

```bash
npx wrangler d1 execute sonhosemvelas --remote --file /tmp/acesso.sql
```

## Segurança

- Login com usuário e senha (o usuário não diferencia maiúsculas de minúsculas).
- O painel usa um cookie de sessão assinado (HttpOnly, SameSite=Strict, 30 dias). Trocar a senha encerra as sessões nos outros aparelhos.
- Depois de 8 tentativas erradas, o login fica bloqueado por 15 minutos para aquele IP.
- Toda alteração exige sessão válida e um cabeçalho próprio do painel.
- O painel não aparece no Google (`noindex` e `robots.txt`).
