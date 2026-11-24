import { json, erro } from '../../_lib/util.js';

// PUT /api/admin/config : WhatsApp, Instagram, aviso do topo e texto "Sobre"
export async function onRequestPut({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return erro('Dados inválidos'); }
  const whatsapp = String(b.whatsapp || '').replace(/\D/g, '');
  if (whatsapp.length < 10 || whatsapp.length > 15) return erro('WhatsApp inválido. Use DDI + DDD + número, ex.: 5566999999999');
  const instagram = String(b.instagram || '').trim().replace(/^@/, '').slice(0, 60);
  const announcement = String(b.announcement || '').trim().slice(0, 200);
  const about = String(b.about || '').trim().slice(0, 3000);
  const home_title = String(b.home_title || '').trim().slice(0, 80) || 'Destaques da semana';
  const home_subtitle = String(b.home_subtitle || '').trim().slice(0, 200);
  await env.DB.prepare(
    `UPDATE settings SET whatsapp = ?1, instagram = ?2, announcement = ?3, about = ?4, home_title = ?5, home_subtitle = ?6,
       updated_at = datetime('now') WHERE id = 1`,
  ).bind(whatsapp, instagram, announcement, about, home_title, home_subtitle).run();
  return json({ ok: true });
}
