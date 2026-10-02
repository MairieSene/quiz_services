import { authorizeAdmin } from '../_shared/admin.ts';
import { getCode, handleOptions, json, rateLimit, rest } from '../_shared/api.ts';

Deno.serve(async (req: Request) => {
  const options = handleOptions(req);
  if (options) return options;
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);

  try {
    if (!await rateLimit(req, 'admin', 90, 60)) return json({ error: 'Trop d’actualisations. Réessaie dans une minute.' }, 429);
    const body = await req.json().catch(() => ({}));
    if (!getCode(body.code)) return json({ error: 'Accès admin invalide.' }, 401);
    const session = await authorizeAdmin(body.code, body.adminSecret);
    if (!session) return json({ error: 'Clé admin incorrecte.' }, 401);

    const response = await rest(`quiz_service_totals?session_id=eq.${session.id}&select=service_id,result_count`);
    if (!response.ok) throw new Error(`Could not read aggregate results (${response.status}).`);
    const rows = await response.json() as Array<{ service_id: string; result_count: number | string }>;
    const results = rows.map((row) => ({ serviceId: row.service_id, count: Number(row.result_count) || 0 }));
    const total = results.reduce((sum, row) => sum + row.count, 0);
    return json({ status: session.status, total, results });
  } catch (error) {
    console.error('admin-results failed:', error);
    return json({ error: 'Le tableau admin est temporairement indisponible.' }, 500);
  }
});
