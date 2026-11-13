-- 002_design_support.sql  |  Design system + restock advisor support
-- Apply AFTER 001_init.sql. Never edit 001 (it is applied); this file is additive.
--
-- Adds:
--   1. profiles            -> display name + UI language for greetings ("Vanakkam, Murugan")
--   2. products.cover_days -> how many days of stock to keep; restock advisor uses it
--      products.category   -> grouping for stock / reports UI
--   3. bill_items.cost_price -> cost snapshot at sale time (gross profit must not drift)
--      create_bill()      -> rewritten (same signature) to write that snapshot
--   4. shopping_lists + shopping_list_items -> "make shopping list" for restock
--
-- Conventions kept from 001: every table is shop-scoped with RLS, numeric money,
-- enums for statuses, security-invoker create_bill().

-- ============================================================
-- 1. profiles — one row per auth user (not per shop)
-- ============================================================
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  -- UI language mode: 'both' = Tamil primary with English underneath (see src/lib/i18n.ts)
  language text not null default 'ta' check (language in ('ta', 'en', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

comment on table profiles is 'Per-user profile. Not shop-scoped: a user can own several shops.';

alter table profiles enable row level security;

-- A user may only read/insert/update their own profile row.
-- The insert policy is required: the app uses the anon key, so without it no row
-- could ever be created for a newly signed-up user.
-- (select auth.uid()) is used so Postgres caches the subquery instead of re-running it per row.
create policy profiles_select_own on profiles for select
  using (user_id = (select auth.uid()));
create policy profiles_insert_own on profiles for insert
  with check (user_id = (select auth.uid()));
create policy profiles_update_own on profiles for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ============================================================
-- 2. products — restock inputs
-- ============================================================
-- cover_days: target days of stock to hold. Default 7 fits shelf-stable groceries;
-- perishables (milk, curd) should be set to 3 by the shop.
alter table products
  add column cover_days int not null default 7 check (cover_days >= 0),
  add column category text;

comment on column products.cover_days is 'Days of stock to keep; restock advisor suggests qty from this.';
comment on column products.category is 'Optional grouping label (rice, dairy, ...). Nullable.';

-- ============================================================
-- 3. bill_items.cost_price — profit snapshot
-- ============================================================
-- Nullable because historical lines predate this column and because a product may
-- have no cost_price. Reports compute gross profit as
--   sum(line_total - qty * bill_items.cost_price)
-- and must NEVER join products.cost_price (it changes over time).
alter table bill_items
  add column cost_price numeric(12,2) check (cost_price >= 0);

comment on column bill_items.cost_price is 'Product cost at sale time (snapshot). Gross profit must use this value, never products.cost_price.';

-- Rewrite create_bill with the same signature: CREATE OR REPLACE keeps the existing
-- owner, default SECURITY INVOKER and function ACL (RLS still applies to the caller).
-- Behaviour is unchanged except that cost_price is now snapshotted per line.
create or replace function create_bill(
  p_bill_id uuid,
  p_shop_id uuid,
  p_items jsonb,
  p_customer_id uuid default null,
  p_payment payment_mode default 'cash',
  p_discount numeric default 0,
  p_source text default 'manual',
  p_created_at timestamptz default now()
) returns uuid language plpgsql as $$
declare
  v_bill_no bigint;
  v_item jsonb;
  v_qty numeric;
  v_price numeric;
  v_cost numeric;
  v_line numeric;
  v_subtotal numeric := 0;
  v_pid uuid;
  v_name text;
begin
  -- idempotency: a retried offline sync returns the same bill, never a duplicate
  if exists (select 1 from bills where id = p_bill_id) then
    return p_bill_id;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'bill must have at least one item';
  end if;

  update shop_counters set last_bill_no = last_bill_no + 1
   where shop_id = p_shop_id returning last_bill_no into v_bill_no;
  if v_bill_no is null then raise exception 'shop not found or no access'; end if;

  insert into bills(id, shop_id, bill_no, customer_id, payment_mode, discount, source, created_by, created_at)
  values (p_bill_id, p_shop_id, v_bill_no, p_customer_id, p_payment, p_discount, p_source,
          (select auth.uid()), p_created_at);

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_pid   := (v_item->>'product_id')::uuid;
    v_qty   := (v_item->>'qty')::numeric;
    v_price := (v_item->>'unit_price')::numeric;
    v_line  := round(v_qty * v_price, 2);

    -- snapshot name AND cost in the same read, so both come from the same product row
    select name, cost_price into v_name, v_cost
      from products where id = v_pid and shop_id = p_shop_id;
    if v_name is null then raise exception 'product % not found in this shop', v_pid; end if;

    insert into bill_items(bill_id, shop_id, product_id, product_name, qty, unit_price, cost_price, line_total)
    values (p_bill_id, p_shop_id, v_pid, v_name, v_qty, v_price, v_cost, v_line);

    insert into stock_movements(shop_id, product_id, move_type, qty_change, ref_bill_id)
    values (p_shop_id, v_pid, 'sale', -v_qty, p_bill_id);

    update products set stock_qty = stock_qty - v_qty where id = v_pid and shop_id = p_shop_id;

    v_subtotal := v_subtotal + v_line;
  end loop;

  update bills set subtotal = v_subtotal, total = greatest(v_subtotal - p_discount, 0)
   where id = p_bill_id;

  if p_payment = 'credit' then
    if p_customer_id is null then raise exception 'credit sale needs a customer'; end if;
    insert into credit_ledger(shop_id, customer_id, amount, ref_bill_id)
    values (p_shop_id, p_customer_id, greatest(v_subtotal - p_discount, 0), p_bill_id);
  end if;

  return p_bill_id;
end $$;

-- Re-assert the ACL from 001 (idempotent). Only signed-in users may create bills.
revoke all on function create_bill(uuid, uuid, jsonb, uuid, payment_mode, numeric, text, timestamptz)
  from public, anon;
grant execute on function create_bill(uuid, uuid, jsonb, uuid, payment_mode, numeric, text, timestamptz)
  to authenticated;

-- ============================================================
-- 4. shopping lists — output of the restock advisor
-- ============================================================
create type shopping_list_status as enum ('open', 'completed', 'dismissed');
create type shopping_item_status as enum ('pending', 'bought', 'skipped');

create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  status shopping_list_status not null default 'open',
  created_at timestamptz not null default now()
);
create index shopping_lists_shop_idx on shopping_lists(shop_id, created_at desc);

create table shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references shopping_lists(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  product_id uuid not null references products(id),
  suggested_qty numeric(14,3) not null check (suggested_qty > 0),
  unit text not null,
  status shopping_item_status not null default 'pending'
);
create index shopping_list_items_list_idx on shopping_list_items(list_id);
create index shopping_list_items_shop_idx on shopping_list_items(shop_id);
-- one line per product per list, so regenerating a suggestion list is a safe upsert
create unique index shopping_list_items_list_product_uq on shopping_list_items(list_id, product_id);

comment on table shopping_lists is 'Restock suggestion list. shop_id is denormalised on items so RLS can check membership without a join.';
comment on column shopping_list_items.unit is 'Unit copy (kg, pcs, ...) at suggestion time, matching products.unit.';

alter table shopping_lists enable row level security;
alter table shopping_list_items enable row level security;

-- Shop members have full access to their shop's lists, same pattern as products_all in 001.
create policy shopping_lists_all on shopping_lists for all
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));

create policy shopping_list_items_all on shopping_list_items for all
  using (is_shop_member(shop_id)) with check (is_shop_member(shop_id));
