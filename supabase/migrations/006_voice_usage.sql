-- 006_voice_usage.sql  |  Daily voice-parse quota per shop
-- Apply AFTER 001 (needs shops + is_shop_member). Additive; never edit 001-005.
--
-- voice_usage: one row per shop per UTC day, counting voice-parse attempts.
--   * clients can read their shop's usage (RLS select) but can never write it.
--   * consume_voice_quota() is security definer: it verifies the caller is signed in
--     and a member of the shop, then atomically increments today's counter.
--   * the 100/day limit is hard-coded in SQL on purpose: taking the limit from the
--     caller would let a client raise its own limit.
-- The voice-parse Edge Function calls this with the user's JWT before calling Gemini.

create table voice_usage (
  shop_id uuid not null references shops(id) on delete cascade,
  usage_date date not null default current_date,
  call_count int not null default 0 check (call_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (shop_id, usage_date)
);

comment on table voice_usage is
  'Voice-parse attempts per shop per UTC day. Written only through consume_voice_quota().';

create trigger voice_usage_updated before update on voice_usage
  for each row execute function set_updated_at();

alter table voice_usage enable row level security;

create policy voice_usage_select on voice_usage for select
  using (is_shop_member(shop_id));

-- Reads are policy-gated; writes only happen inside the security definer function.
grant select on voice_usage to authenticated;
revoke insert, update, delete on voice_usage from anon, authenticated;

-- Returns the outcome of reserving one call. Attempts are counted (not only
-- successes), so a caller cannot retry around the quota and burn Gemini credits.
create or replace function consume_voice_quota(p_shop_id uuid)
returns table (allowed boolean, used int, remaining int)
language plpgsql security definer set search_path = public as $$
declare
  v_limit constant int := 100;  -- must match DAILY_LIMIT in functions/voice-parse/index.ts
  v_used int;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not is_shop_member(p_shop_id) then
    raise exception 'shop not found or no access' using errcode = '42501';
  end if;

  -- Atomic reserve: the WHERE makes the increment a no-op once the limit is reached,
  -- so concurrent calls cannot push the count past 100.
  insert into voice_usage(shop_id, usage_date, call_count)
  values (p_shop_id, current_date, 1)
  on conflict (shop_id, usage_date) do update
    set call_count = voice_usage.call_count + 1
    where voice_usage.call_count < v_limit
  returning call_count into v_used;

  if v_used is null then
    select u.call_count into v_used
      from voice_usage u
     where u.shop_id = p_shop_id and u.usage_date = current_date;
    return query select false, coalesce(v_used, v_limit), 0;
    return;
  end if;

  return query select true, v_used, greatest(v_limit - v_used, 0);
end $$;

revoke all on function consume_voice_quota(uuid) from public, anon;
grant execute on function consume_voice_quota(uuid) to authenticated;
