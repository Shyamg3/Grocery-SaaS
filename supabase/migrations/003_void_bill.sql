-- Void a bill without deleting it.
-- Keeps the row (status = 'void') and reverses its side effects:
--   * returns the sold quantities to stock (stock_movements + products.stock_qty)
--   * posts a negative credit_ledger entry for credit bills
-- Idempotent: voiding an already voided bill does nothing.
-- security invoker: RLS still proves the caller is a member of the shop.

create or replace function void_bill(p_bill_id uuid)
returns void language plpgsql as $$
declare
  v_bill bills%rowtype;
  v_item bill_items%rowtype;
begin
  select * into v_bill from bills where id = p_bill_id for update;
  if v_bill.id is null then
    raise exception 'bill not found or no access';
  end if;
  if v_bill.status = 'void' then
    return;
  end if;

  update bills set status = 'void' where id = p_bill_id;

  for v_item in select * from bill_items where bill_id = p_bill_id loop
    insert into stock_movements(shop_id, product_id, move_type, qty_change, ref_bill_id, note)
    values (v_bill.shop_id, v_item.product_id, 'return', v_item.qty, p_bill_id, 'void');

    update products set stock_qty = stock_qty + v_item.qty
     where id = v_item.product_id and shop_id = v_bill.shop_id;
  end loop;

  if v_bill.payment_mode = 'credit' and v_bill.customer_id is not null then
    insert into credit_ledger(shop_id, customer_id, amount, ref_bill_id, note)
    values (v_bill.shop_id, v_bill.customer_id, -v_bill.total, p_bill_id, 'void');
  end if;
end $$;

revoke all on function void_bill(uuid) from public, anon;
grant execute on function void_bill(uuid) to authenticated;
