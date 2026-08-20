create table public.instagram_api_cache (
  cache_key text primary key,
  endpoint text not null,
  request_params jsonb not null default '{}'::jsonb,
  result_status text not null
    check (result_status in ('success', 'not_found')),
  payload jsonb,
  source text not null default 'gestao-apruma',
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  hit_count bigint not null default 0 check (hit_count >= 0),
  last_hit_at timestamptz,
  constraint instagram_api_cache_payload_check check (
    (result_status = 'success' and payload is not null)
    or (result_status = 'not_found' and payload is null)
  )
);

create index instagram_api_cache_expires_idx
  on public.instagram_api_cache (expires_at);

alter table public.instagram_api_cache enable row level security;

revoke all on table public.instagram_api_cache from anon, authenticated;
grant all on table public.instagram_api_cache to service_role;

create or replace function public.consume_instagram_api_cache(p_cache_key text)
returns table(result_status text, payload jsonb)
language sql
security definer
set search_path = ''
as $$
  update public.instagram_api_cache
  set
    hit_count = hit_count + 1,
    last_hit_at = now()
  where cache_key = p_cache_key
    and expires_at > now()
  returning
    instagram_api_cache.result_status,
    instagram_api_cache.payload;
$$;

revoke all on function public.consume_instagram_api_cache(text) from public;
grant execute on function public.consume_instagram_api_cache(text) to service_role;

comment on table public.instagram_api_cache is
  'Cache server-side compartilhado pelas rotinas de Instagram do Gestão Apruma.';
