import { getCode, handleOptions, json, randomToken, rateLimit, rest, sha256 } from '../_shared/api.ts';

Deno.serve(async (req: Request) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  try {
    if (!await rateLimit(req, 'join', 40, 600)) return json({ error: 'Trop de tentatives de connexion. Réessaie dans quelques minutes.' }, 429);
    const body = await req.json().catch(() => ({}));
    const code = getCode(body.code);
    if (!code) return json({ error: 'Saisis un numéro de session à 6 chiffres.' }, 400);

    const response = await rest(`quiz_sessions?code=eq.${code}&select=id,expires_at,status`);
    if (!response.ok) throw new Error(`Session lookup failed (${response.status}).`);
    const [session] = await response.json();
    if (!session || session.status !== 'active' || new Date(session.expires_at).getTime() <= Date.now()) {
      return json({ error: 'Numéro incorrect ou session terminée.' }, 404);
    }

    const participantToken = randomToken(32);
    const tokenHash = await sha256(participantToken);
    const tokenResponse = await rest('rpc/issue_quiz_participant_token', {
      method: 'POST',
      body: JSON.stringify({ p_session_id: session.id, p_token_hash: tokenHash }),
    });
    if (!tokenResponse.ok) throw new Error(`Could not issue participant token (${tokenResponse.status}).`);
    const tokenResult = await tokenResponse.json();
    if (!tokenResult.accepted) return json({ error: 'Cette session vient de se terminer.' }, 410);
    return json({ sessionId: session.id, participantToken });
  } catch (error) {
    console.error('join-session failed:', error);
    return json({ error: 'La session n’a pas pu être rejointe. Réessaie.' }, 500);
  }
});
