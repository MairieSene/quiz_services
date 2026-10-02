export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '600',
};

export const serviceIds = new Set([
  'accueil-etat-civil', 'secretariat-general', 'police-municipale', 'services-techniques',
  'astreinte-technique', 'environnement', 'mouillages-affaires-maritimes', 'urbanisme-vie-economique',
  'ccas', 'maison-habitants', 'residence-penhoet', 'finances-comptabilite', 'marches-juridiques',
  'drh', 'petite-enfance-jeunesse', 'sport-culture-associatif', 'communication', 'reserve-naturelle',
]);

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function handleOptions(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null;
}

export function readSecretKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const keys = JSON.parse(secretKeys) as Record<string, string>;
      const key = keys.default || Object.values(keys)[0];
      if (key) return key;
    } catch {
      // Report the missing project secret below without exposing its value.
    }
  }
  throw new Error('Supabase server key is unavailable in the Edge Function environment.');
}

const projectUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '');
let cachedKey: string | null = null;

export async function rest(path: string, init: RequestInit = {}): Promise<Response> {
  const secretKey = cachedKey || (cachedKey = readSecretKey());
  if (!projectUrl) throw new Error('SUPABASE_URL is unavailable in the Edge Function environment.');
  const headers = new Headers(init.headers);
  headers.set('apikey', secretKey);
  headers.set('Authorization', `Bearer ${secretKey}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return await fetch(`${projectUrl}/rest/v1/${path}`, { ...init, headers });
}

export async function restJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await rest(path, init);
  if (!response.ok) {
    const details = await response.text();
    console.error('Supabase Data API request failed:', response.status, details.slice(0, 300));
    throw new Error('Database request failed. Check the deployed migration and server permissions.');
  }
  return await response.json() as T;
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32): string {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = '';
  for (const value of values) binary += String.fromCharCode(value);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function randomCode(): string {
  const values = crypto.getRandomValues(new Uint32Array(1));
  return String(values[0] % 1_000_000).padStart(6, '0');
}

export function constantTimeEqual(left: string, right: string): boolean {
  let mismatch = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) mismatch |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return mismatch === 0;
}

async function fingerprint(req: Request): Promise<string> {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown-client';
  return await sha256(`${readSecretKey()}:${forwarded}`);
}

export async function rateLimit(req: Request, action: string, maxHits: number, windowSeconds: number): Promise<boolean> {
  const clientFingerprint = await fingerprint(req);
  const response = await rest('rpc/consume_quiz_rate_limit', {
    method: 'POST',
    body: JSON.stringify({
      p_action: action,
      p_fingerprint_hash: clientFingerprint,
      p_max_hits: maxHits,
      p_window_seconds: windowSeconds,
    }),
  });
  if (!response.ok) {
    console.error('Rate limit check failed:', response.status, (await response.text()).slice(0, 300));
    throw new Error('Security limit service is unavailable.');
  }
  return await response.json() === true;
}

export function getCode(value: unknown): string | null {
  return typeof value === 'string' && /^\d{6}$/.test(value) ? value : null;
}

export function publicError(message: string, status = 400): Response {
  return json({ error: message }, status);
}
