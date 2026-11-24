// Utilitários compartilhados pelas Functions

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function erro(mensagem, status = 400) {
  return json({ erro: mensagem }, status);
}

export function slugify(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

export function novoId() {
  return crypto.randomUUID();
}

// Converte uma linha do banco para o formato usado no site
export function produtoDoBanco(row) {
  if (!row) return null;
  let images = [];
  try { images = JSON.parse(row.images || '[]'); } catch { images = []; }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price_cents: row.price_cents,
    promo_price_cents: row.promo_price_cents ?? null,
    installments: row.installments ?? 1,
    interest_free: row.interest_free === undefined ? true : !!row.interest_free,
    featured_position: row.featured_position ?? 0,
    category_id: row.category_id,
    category_name: row.category_name ?? null,
    category_slug: row.category_slug ?? null,
    aroma: row.aroma,
    size: row.size,
    images,
    available: !!row.available,
    featured: !!row.featured,
    visible: !!row.visible,
    position: row.position,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const SELECT_PRODUTO = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

export const ORDEM_PRODUTO = `ORDER BY p.featured DESC, p.position ASC, p.created_at DESC`;

// Garante slug único (acrescenta -2, -3... se preciso)
export async function slugUnico(db, tabela, base, ignorarId = null) {
  let slug = slugify(base);
  for (let i = 2; i < 200; i++) {
    const existe = await db
      .prepare(`SELECT id FROM ${tabela} WHERE slug = ?1 AND (?2 IS NULL OR id != ?2)`)
      .bind(slug, ignorarId)
      .first();
    if (!existe) return slug;
    slug = `${slugify(base)}-${i}`;
  }
  return `${slugify(base)}-${novoId().slice(0, 6)}`;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
