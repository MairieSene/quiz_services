import { authorizeAdmin } from '../_shared/admin.ts';
import { getCode, handleOptions, json, rateLimit, rest } from '../_shared/api.ts';

Deno.serve(async (req: Request) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  try {
    if (!await rateLimit(req, 'close', 10, 600)) return json({ error: 'Trop de tentatives. Réessaie plus tard.' }, 429);
    const body = await req.json().catch(() => ({}));
    if (!getCode(body.code)) return json({ error: 'Accès admin invalide.' }, 401);
    const session = await authorizeAdmin(body.code, body.adminSecret);
    if (!session) return json({ error: 'Clé admin incorrecte.' }, 401);

    if (session.status === 'active') {
      const response = await rest(`quiz_sessions?id=eq.${session.id}&status=eq.active`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'closed', closed_at: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error(`Could not close session (${response.status}).`);
      const tokenDelete = await rest(`quiz_participant_tokens?session_id=eq.${session.id}`, { method: 'DELETE' });
      if (!tokenDelete.ok) throw new Error(`Could not clear participant tokens (${tokenDelete.status}).`);
    }
    return json({ ok: true, status: 'closed' });
  } catch (error) {
    console.error('close-session failed:', error);
    return json({ error: 'La session n’a pas pu être terminée.' }, 500);
  }
});
