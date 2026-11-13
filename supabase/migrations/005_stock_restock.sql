-- 005_stock_restock.sql  |  Restock insights (avg sales, days left, suggested buy)
-- Apply AFTER 001 and 002 (needs products.cover_days). Additive; never edit 001/002.
--
-- stock_insights() is read-only and shop-scoped. Numbers:
--   sold_14d     = units sold in the last 14 days (active bills)
--   avg_daily    = sold_14d / 14
--   days_left    = stock_qty / avg_daily       (null when nothing sold)
--   suggested_qty= greatest(0, avg_daily * cover_days - stock_qty)
-- Rounding to pack sizes happens in the app; the RPC returns exact decimals.
--
-- security invoker: RLS on bills/bill_items/products still proves shop membership.

create or replace function stock_insights(p_shop_id uuid)
returns table (
  product_id uuid,
  sold_14d numeric,
  avg_daily numeric,
  days_left numeric,
  suggested_qty numeric
) language sql stable as $$
  with sold as (
    select bi.product_id, sum(bi.qty) as qty
    from bill_items bi
    join bills b on b.id = bi.bill_id
    where bi.shop_id = p_shop_id
      and b.status = 'active'
      and b.created_at >= now() - interval '14 days'
    group by bi.product_id
  )
  select
    p.id,
    coalesce(s.qty, 0) as sold_14d,
    round(coalesce(s.qty, 0) / 14.0, 3) as avg_daily,
    case
      when coalesce(s.qty, 0) > 0 then round(p.stock_qty / (s.qty / 14.0), 1)
      else null
    end as days_left,
    case
      when coalesce(s.qty, 0) > 0 then greatest(0, round((s.qty / 14.0) * p.cover_days - p.stock_qty, 3))
      else 0
    end as suggested_qty
  from products p
  left join sold s on s.product_id = p.id
  where p.shop_id = p_shop_id
    and p.deleted_at is null
$$;

revoke all on function stock_insights(uuid) from public, anon;
grant execute on function stock_insights(uuid) to authenticated;
