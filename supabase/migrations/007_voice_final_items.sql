-- 007_voice_final_items.sql  |  Save the owner-confirmed items on a voice event
-- Apply AFTER 001 (voice_events). Additive; never edit 001-006.
--
-- 001 gives voice_events select + insert policies only, so a broad UPDATE policy
-- would let the client rewrite transcript/parsed as well. This security definer
-- RPC writes final_items and nothing else, after proving shop membership.
-- The accuracy loop: parsed = what the AI understood, final_items = what the owner
-- actually put on the bill.

create or replace function save_voice_final_items(p_event_id uuid, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from voice_events where id = p_event_id;
  if v_shop is null or not is_shop_member(v_shop) then
    raise exception 'voice event not found or no access' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'final items must be an array' using errcode = '22023';
  end if;

  update voice_events set final_items = p_items where id = p_event_id;
end $$;

revoke all on function save_voice_final_items(uuid, jsonb) from public, anon;
grant execute on function save_voice_final_items(uuid, jsonb) to authenticated;
