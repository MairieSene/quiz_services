import { handleOptions, json, randomCode, randomToken, rateLimit, rest, sha256 } from '../_shared/api.ts';

Deno.serve(async (req: Request) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  try {
    if (!await rateLimit(req, 'create', 6, 3600)) return json({ error: 'Trop de sessions créées depuis cette connexion. Réessaie plus tard.' }, 429);
    const adminSecret = randomToken(32);
    const adminSecretHash = await sha256(adminSecret);

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode();
      const response = await rest('quiz_sessions?select=id,code,expires_at', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ code, admin_secret_hash: adminSecretHash }),
      });
      if (response.ok) {
        const [session] = await response.json();
        return json({ sessionId: session.id, code, expiresAt: session.expires_at, adminSecret });
      }
      if (response.status !== 409) {
        console.error('Session creation failed:', response.status, (await response.text()).slice(0, 300));
        return json({ error: 'La session n’a pas pu être créée. Vérifie que la migration Supabase est déployée.' }, 500);
      }
    }
    return json({ error: 'Impossible de réserver un numéro de session. Réessaie.' }, 503);
  } catch (error) {
    console.error('create-session failed:', error);
    return json({ error: 'Le service de session est indisponible pour le moment.' }, 500);
  }
});
