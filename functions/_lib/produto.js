import { erro } from './util.js';

const CHAVE_FOTO = /^[a-z0-9-]+\.(webp|jpg|jpeg|png)$/i;

// Valida e normaliza o que vem do formulário do painel
export async function lerProduto(request, db) {
  let b;
  try { b = await request.json(); } catch { return { falha: erro('Dados inválidos') }; }

  const name = String(b.name || '').trim().slice(0, 120);
  if (!name) return { falha: erro('Dê um nome ao produto') };

  let price_cents = null;
  if (b.price_cents !== null && b.price_cents !== undefined && b.price_cents !== '') {
    price_cents = Math.round(Number(b.price_cents));
    if (!Number.isFinite(price_cents) || price_cents < 0 || price_cents > 10_000_000) {
      return { falha: erro('Preço inválido') };
    }
  }

  let category_id = b.category_id ? String(b.category_id) : null;
  if (category_id) {
    const cat = await db.prepare('SELECT id FROM categories WHERE id = ?1').bind(category_id).first();
    if (!cat) category_id = null;
  }

  const images = Array.isArray(b.images) ? b.images.map(String).filter((k) => CHAVE_FOTO.test(k)).slice(0, 12) : [];

  return {
    dados: {
      name,
      description: String(b.description || '').trim().slice(0, 5000),
      price_cents,
      category_id,
      aroma: String(b.aroma || '').trim().slice(0, 120),
      size: String(b.size || '').trim().slice(0, 120),
      images,
      available: b.available === false ? 0 : 1,
      featured: b.featured ? 1 : 0,
      visible: b.visible === false ? 0 : 1,
    },
  };
}

export async function apagarFotos(env, chaves) {
  const validas = chaves.filter((k) => CHAVE_FOTO.test(k));
  await Promise.all(validas.map((k) => env.FOTOS.delete(k)));
}

export { CHAVE_FOTO };
