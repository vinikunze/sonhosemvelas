# Sonhos em Velas

Site catálogo da Sonhos em Velas (velas aromáticas artesanais, Sinop, MT), com painel para cadastrar produtos.

- **Site público** (`/`): catálogo com busca e categorias, página de cada produto (`/p/nome-do-produto`) e pedido pelo WhatsApp com mensagem pronta.
- **Painel** (`/admin`): login por senha, cadastro de produtos com fotos (reduzidas automaticamente no celular), categorias e ajustes do site (WhatsApp, Instagram, aviso no topo, texto "Sobre").

## Como funciona

Tudo roda na Cloudflare, no plano gratuito:

| Parte | Serviço | Onde está no código |
|---|---|---|
| Páginas do site | Cloudflare Pages | `public/` |
| API e páginas de produto | Pages Functions | `functions/` |
| Produtos, categorias, ajustes | D1 (banco SQLite) | `migrations/` |
| Fotos | R2 | enviadas pelo painel, servidas em `/fotos/...` |

Não há etapa de build: HTML, CSS e JavaScript puros.

## Rodar no computador

```bash
npm install
```

```bash
printf 'ADMIN_PASSWORD=teste123\nSESSION_SECRET=um-texto-aleatorio-bem-longo\n' > .dev.vars
```

```bash
npm run db:local
```

```bash
npm run dev
```

Abra http://localhost:8788 (site) e http://localhost:8788/admin (painel, senha `teste123`).

## Publicar na Cloudflare (primeira vez)

1. Criar o banco e o bucket de fotos:

```bash
npx wrangler d1 create sonhosemvelas
```

```bash
npx wrangler r2 bucket create sonhosemvelas-fotos
```

2. Copiar o `database_id` que o primeiro comando mostrar para o `wrangler.toml`.
3. Aplicar a estrutura do banco:

```bash
npm run db:remote
```

4. Criar o projeto Pages e publicar:

```bash
npx wrangler pages project create sonhosemvelas --production-branch main
```

```bash
npm run deploy
```

5. Definir os segredos do painel (o comando pede o valor):

```bash
npx wrangler pages secret put ADMIN_PASSWORD
```

```bash
npx wrangler pages secret put SESSION_SECRET
```

Depois de mudar segredos, publique de novo (`npm run deploy`) para valerem.

## Trocar a senha do painel

Rode `npx wrangler pages secret put ADMIN_PASSWORD` com a nova senha e publique de novo. Todas as sessões abertas são encerradas automaticamente.

## Segurança

- O painel usa um cookie de sessão assinado (HttpOnly, SameSite=Strict, 30 dias).
- Depois de 8 senhas erradas, o login fica bloqueado por 15 minutos para aquele IP.
- Toda alteração exige sessão válida e um cabeçalho próprio do painel.
- O painel não aparece no Google (`noindex` e `robots.txt`).
