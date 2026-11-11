// POST /api/scan  — recibe la foto del ticket (base64) y devuelve los ítems en JSON.
// Requiere: usuario autenticado en tu Firebase (anónimo alcanza).
// Variables de entorno: GEMINI_API_KEY (gratis en aistudio.google.com) y FIREBASE_PROJECT_ID.
import { createRemoteJWKSet, jwtVerify } from 'jose';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const MAX_B64 = 4_000_000; // ~3 MB de imagen (Vercel corta el body en 4,5 MB)

const PROMPT = `Sos un lector de tickets y facturas de restaurantes y bares de Argentina. Mirá la imagen y extraé los ítems consumidos.

Respondé SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma:
{"items":[{"name":"string","qty":number,"total":number}],"ticket_total":number|null}

Reglas:
- "total" es el importe de la línea completa (cantidad × precio unitario), tal como figura a la derecha.
- Formato argentino: el punto separa miles y la coma decimales ("12.500,50" = 12500.5). Devolvé números JSON normales, sin símbolos.
- Incluí el cubierto / servicio de mesa como un ítem más.
- NO incluyas como ítems: subtotales, IVA, percepciones, medios de pago, vuelto, propina ni el total.
- Si hay descuentos por línea, restalos del importe de esa línea.
- Nombres cortos y legibles en español; expandí abreviaturas obvias (ej. "BIFE CHOR" → "Bife de chorizo").
- "ticket_total" es el TOTAL final a pagar impreso en el ticket, o null si no se ve.
- Si la imagen no es un ticket, devolvé {"items":[],"ticket_total":null}.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // 1) Usuario de tu Firebase
  const m = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'no_token' });
  let uid;
  try {
    const { payload } = await jwtVerify(m[1], JWKS, { issuer: `https://securetoken.google.com/${PROJECT_ID}`, audience: PROJECT_ID });
    uid = payload.sub;
    if (!uid) throw new Error('no sub');
  }
  catch { return res.status(401).json({ error: 'bad_token' }); }

  // 2) Datos
  const { image, mediaType } = req.body || {};
  if (typeof image !== 'string' || !image.length || image.length > MAX_B64) return res.status(400).json({ error: 'bad_image' });
  const type = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType) ? mediaType : 'image/jpeg';

  // 3) Gemini lee el ticket
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [
          { inline_data: { mime_type: type, data: image } },
          { text: PROMPT },
        ] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
    if (r.status === 429) return res.status(429).json({ error: 'rate_limited' });
    if (!r.ok) { console.error('gemini', r.status, await r.text()); return res.status(502).json({ error: 'ai_error' }); }
    const j = await r.json();
    const txt = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    const mm = txt.match(/\{[\s\S]*\}/);
    const data = JSON.parse(mm ? mm[0] : txt);
    return res.status(200).json({ items: Array.isArray(data.items) ? data.items : [], ticket_total: data.ticket_total ?? null });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'parse_error' });
  }
}
