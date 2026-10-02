import { constantTimeEqual, getCode, rest, sha256 } from './api.ts';

export type AdminSession = {
  id: string;
  code: string;
  admin_secret_hash: string;
  status: 'active' | 'closed';
  expires_at: string;
  closed_at: string | null;
};

export async function authorizeAdmin(codeValue: unknown, secretValue: unknown): Promise<AdminSession | null> {
  const code = getCode(codeValue);
  const secret = typeof secretValue === 'string' && secretValue.length <= 100 ? secretValue : '';
  const response = await rest(`quiz_sessions?code=eq.${code || 'invalid'}&select=id,code,admin_secret_hash,status,expires_at,closed_at`);
  if (!response.ok) throw new Error(`Admin session lookup failed (${response.status}).`);
  const [session] = await response.json() as AdminSession[];
  const suppliedHash = await sha256(secret);
  if (!session || !constantTimeEqual(session.admin_secret_hash, suppliedHash)) return null;

  if (session.status === 'active' && new Date(session.expires_at).getTime() <= Date.now()) {
    const closeResponse = await rest(`quiz_sessions?id=eq.${session.id}&status=eq.active`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'closed', closed_at: session.expires_at }),
    });
    if (!closeResponse.ok) throw new Error(`Could not expire session (${closeResponse.status}).`);
    session.status = 'closed';
    session.closed_at = session.expires_at;
  }
  return session;
}
