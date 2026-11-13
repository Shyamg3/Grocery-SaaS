-- 004_stock_in.sql  |  Stock-in and stock correction RPCs
-- Apply AFTER 001_init.sql (and after 002/003 if you use them). Never edit 001.
--
-- Numbering note: 002_design_support.sql and 003_void_bill.sql already exist, so the
-- stock RPCs take the next number (004) instead of reusing 002.
--
-- Both functions run as the caller (security invoker), so the products and
-- stock_movements RLS policies from 001 still apply. The client never writes
-- products.stock_qty or stock_movements directly; it calls these RPCs.

-- ============================================================
-- add_stock: record a purchase and increase stock, in one transaction
-- p_items example: [{"product_id":"...","qty":10,"cost_price":48.50}]
-- cost_price is optional; when present it also updates products.cost_price
-- (the shop's latest buying price).
-- ============================================================
create or replace function add_stock(
  p_shop_id uuid,
  p_items jsonb,
  p_note text default null
) returns int language plpgsql as $$
declare
  v_item jsonb;
  v_pid uuid;
  v_qty numeric;
  v_cost numeric;
  v_stock numeric;
  v_count int := 0;
begin
  if not is_shop_member(p_shop_id) then
    raise exception 'shop not found or no access';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'stock-in must have at least one item';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'quantity must be greater than zero';
    end if;

    -- lock the row so two stock-ins cannot overwrite each other
    select stock_qty into v_stock from products
     where id = v_pid and shop_id = p_shop_id
     for update;
    if not found then
      raise exception 'product % not found in this shop', v_pid;
    end if;

    insert into stock_movements(shop_id, product_id, move_type, qty_change, note)
    values (p_shop_id, v_pid, 'purchase', v_qty, nullif(btrim(p_note), ''));

    if v_item ? 'cost_price' and (v_item->>'cost_price') is not null then
      v_cost := (v_item->>'cost_price')::numeric;
      if v_cost < 0 then
        raise exception 'cost price cannot be negative';
      end if;
      update products
         set stock_qty = stock_qty + v_qty, cost_price = v_cost
       where id = v_pid and shop_id = p_shop_id;
    else
      update products
         set stock_qty = stock_qty + v_qty
       where id = v_pid and shop_id = p_shop_id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

-- ============================================================
-- adjust_stock: correct stock to a counted quantity
-- Writes an 'adjustment' movement for the difference, so the movement log
-- always explains the current stock_qty. A note (reason) is required.
-- ============================================================
create or replace function adjust_stock(
  p_shop_id uuid,
  p_product_id uuid,
  p_new_qty numeric,
  p_note text
) returns numeric language plpgsql as $$
declare
  v_current numeric;
  v_delta numeric;
begin
  if not is_shop_member(p_shop_id) then
    raise exception 'shop not found or no access';
  end if;

  if p_note is null or btrim(p_note) = '' then
    raise exception 'a reason is required to correct stock';
  end if;

  if p_new_qty is null or p_new_qty < 0 then
    raise exception 'corrected quantity cannot be negative';
  end if;

  select stock_qty into v_current from products
   where id = p_product_id and shop_id = p_shop_id
   for update;
  if not found then
    raise exception 'product % not found in this shop', p_product_id;
  end if;

  v_delta := p_new_qty - v_current;
  if v_delta = 0 then
    return 0;
  end if;

  insert into stock_movements(shop_id, product_id, move_type, qty_change, note)
  values (p_shop_id, p_product_id, 'adjustment', v_delta, btrim(p_note));

  update products set stock_qty = p_new_qty
   where id = p_product_id and shop_id = p_shop_id;

  return v_delta;
end $$;

-- Only signed-in users may change stock (same ACL pattern as create_bill in 001).
revoke all on function add_stock(uuid, jsonb, text) from public, anon;
grant execute on function add_stock(uuid, jsonb, text) to authenticated;

revoke all on function adjust_stock(uuid, uuid, numeric, text) from public, anon;
grant execute on function adjust_stock(uuid, uuid, numeric, text) to authenticated;
