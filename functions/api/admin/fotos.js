import { json, erro, novoId } from '../../_lib/util.js';

const TIPOS = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_BYTES = 8 * 1024 * 1024;

// POST /api/admin/fotos : recebe a foto (já reduzida no celular) e guarda no KV
export async function onRequestPost({ request, env }) {
  const tipo = (request.headers.get('content-type') || '').split(';')[0].trim();
  const ext = TIPOS[tipo];
  if (!ext) return erro('Formato de foto não aceito. Use JPG, PNG ou WebP.');
  const corpo = await request.arrayBuffer();
  if (!corpo.byteLength) return erro('Foto vazia');
  if (corpo.byteLength > MAX_BYTES) return erro('Foto muito grande (máx. 8 MB)');
  const key = `${novoId()}.${ext}`;
  await env.FOTOS.put(key, corpo, { metadata: { contentType: tipo } });
  return json({ key }, 201);
}
