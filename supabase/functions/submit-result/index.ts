import { handleOptions, json, rateLimit, rest, serviceIds, sha256 } from '../_shared/api.ts';

Deno.serve(async (req: Request) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  try {
    if (!await rateLimit(req, 'submit', 60, 600)) return json({ error: 'Trop de résultats envoyés depuis cette connexion. Réessaie dans quelques minutes.' }, 429);
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' && /^[0-9a-f-]{36}$/i.test(body.sessionId) ? body.sessionId : null;
    const participantToken = typeof body.participantToken === 'string' && body.participantToken.length <= 100 ? body.participantToken : null;
    const serviceId = typeof body.serviceId === 'string' && serviceIds.has(body.serviceId) ? body.serviceId : null;
    if (!sessionId || !participantToken || !serviceId) return json({ error: 'Les informations du résultat sont invalides.' }, 400);

    const result = await rest('rpc/record_quiz_result', {
      method: 'POST',
      body: JSON.stringify({ p_session_id: sessionId, p_token_hash: await sha256(participantToken), p_service_id: serviceId }),
    });
    if (!result.ok) {
      console.error('Result recording failed:', result.status, (await result.text()).slice(0, 300));
      throw new Error('Result recording failed.');
    }
    const payload = await result.json();
    if (!payload.accepted) {
      if (payload.reason === 'token_used_or_expired') return json({ ok: true, duplicate: true });
      if (payload.reason === 'session_closed') return json({ error: 'Cette session est terminée; le résultat n’a pas été enregistré.' }, 410);
      return json({ error: 'Le résultat ne peut pas être enregistré.' }, 400);
    }
    return json({ ok: true });
  } catch (error) {
    console.error('submit-result failed:', error);
    return json({ error: 'Le résultat n’a pas pu être transmis. Tu peux réessayer.' }, 500);
  }
});
