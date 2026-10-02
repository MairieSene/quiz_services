create extension if not exists pg_cron;

create table public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[0-9]{6}$'),
  admin_secret_hash text not null check (length(admin_secret_hash) = 64),
  status text not null default 'active' check (status in ('active', 'closed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  closed_at timestamptz
);

create table public.quiz_service_totals (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  service_id text not null,
  result_count bigint not null default 0 check (result_count >= 0),
  primary key (session_id, service_id)
);

create table public.quiz_participant_tokens (
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  token_hash text not null check (length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  primary key (session_id, token_hash)
);

create table public.quiz_rate_limits (
  action text not null,
  fingerprint_hash text not null check (length(fingerprint_hash) = 64),
  window_start timestamptz not null,
  hit_count integer not null default 1,
  primary key (action, fingerprint_hash, window_start)
);

alter table public.quiz_sessions enable row level security;
alter table public.quiz_service_totals enable row level security;
alter table public.quiz_participant_tokens enable row level security;
alter table public.quiz_rate_limits enable row level security;

revoke all on public.quiz_sessions, public.quiz_service_totals, public.quiz_participant_tokens, public.quiz_rate_limits from public, anon, authenticated;
grant all on public.quiz_sessions, public.quiz_service_totals, public.quiz_participant_tokens, public.quiz_rate_limits to service_role;

create or replace function public.consume_quiz_rate_limit(
  p_action text,
  p_fingerprint_hash text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_action not in ('create', 'join', 'submit', 'admin', 'close')
     or p_fingerprint_hash !~ '^[a-f0-9]{64}$'
     or p_max_hits < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.quiz_rate_limits (action, fingerprint_hash, window_start, hit_count)
  values (p_action, p_fingerprint_hash, v_window_start, 1)
  on conflict (action, fingerprint_hash, window_start)
  do update set hit_count = public.quiz_rate_limits.hit_count + 1
  returning hit_count into v_hits;
  return v_hits <= p_max_hits;
end;
$$;

create or replace function public.record_quiz_result(
  p_session_id uuid,
  p_token_hash text,
  p_service_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.quiz_sessions%rowtype;
  v_token_hash text;
begin
  if p_service_id not in (
    'accueil-etat-civil', 'secretariat-general', 'police-municipale', 'services-techniques',
    'astreinte-technique', 'environnement', 'mouillages-affaires-maritimes', 'urbanisme-vie-economique',
    'ccas', 'maison-habitants', 'residence-penhoet', 'finances-comptabilite', 'marches-juridiques',
    'drh', 'petite-enfance-jeunesse', 'sport-culture-associatif', 'communication', 'reserve-naturelle'
  ) then
    return jsonb_build_object('accepted', false, 'reason', 'invalid_service');
  end if;

  select * into v_session
  from public.quiz_sessions
  where id = p_session_id
  for update;

  if not found or v_session.status <> 'active' or v_session.expires_at <= now() then
    return jsonb_build_object('accepted', false, 'reason', 'session_closed');
  end if;

  update public.quiz_participant_tokens
  set used_at = now()
  where session_id = p_session_id
    and token_hash = p_token_hash
    and used_at is null
    and expires_at > now()
  returning token_hash into v_token_hash;

  if not found then
    return jsonb_build_object('accepted', false, 'reason', 'token_used_or_expired');
  end if;

  insert into public.quiz_service_totals (session_id, service_id, result_count)
  values (p_session_id, p_service_id, 1)
  on conflict (session_id, service_id)
  do update set result_count = public.quiz_service_totals.result_count + 1;

  return jsonb_build_object('accepted', true);
end;
$$;

create or replace function public.issue_quiz_participant_token(
  p_session_id uuid,
  p_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.quiz_sessions%rowtype;
begin
  select * into v_session
  from public.quiz_sessions
  where id = p_session_id
  for update;

  if not found or v_session.status <> 'active' or v_session.expires_at <= now() then
    return jsonb_build_object('accepted', false);
  end if;

  insert into public.quiz_participant_tokens (session_id, token_hash, expires_at)
  values (p_session_id, p_token_hash, v_session.expires_at);
  return jsonb_build_object('accepted', true);
end;
$$;

create or replace function public.cleanup_quiz_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.quiz_sessions
  set status = 'closed', closed_at = expires_at
  where status = 'active' and expires_at <= now();

  delete from public.quiz_participant_tokens t
  using public.quiz_sessions s
  where t.session_id = s.id and s.status = 'closed';

  delete from public.quiz_sessions
  where status = 'closed' and closed_at <= now() - interval '30 days';

  delete from public.quiz_rate_limits
  where window_start < now() - interval '2 days';
end;
$$;

revoke all on function public.consume_quiz_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.record_quiz_result(uuid, text, text) from public, anon, authenticated;
revoke all on function public.issue_quiz_participant_token(uuid, text) from public, anon, authenticated;
revoke all on function public.cleanup_quiz_data() from public, anon, authenticated;
grant execute on function public.consume_quiz_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.record_quiz_result(uuid, text, text) to service_role;
grant execute on function public.issue_quiz_participant_token(uuid, text) to service_role;
grant execute on function public.cleanup_quiz_data() to service_role;

select cron.schedule('quiz-session-cleanup', '13 3 * * *', 'select public.cleanup_quiz_data()');
