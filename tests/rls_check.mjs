// Two-user RLS + create_bill idempotency check. Runs against a REAL Supabase
// test project (never production): it creates two disposable users and shops.
//
//   SUPABASE_TEST_URL=https://xxx.supabase.co \
//   SUPABASE_TEST_ANON_KEY=eyJ... \
//   npm run test:rls
//
// Requires 001_init.sql (and 002..005) applied. Email confirmation must be off
// in the test project, otherwise sign-up cannot produce a session.

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const url = process.env.SUPABASE_TEST_URL
const anonKey = process.env.SUPABASE_TEST_ANON_KEY

if (!url || !anonKey) {
  console.error('Missing SUPABASE_TEST_URL and/or SUPABASE_TEST_ANON_KEY.')
  console.error('Use a throwaway Supabase project, never production.')
  process.exit(2)
}

let failures = 0
function check(name, ok, detail) {
  if (ok) {
    console.log(`  ok   ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function errText(error) {
  return error ? `${error.code ?? ''} ${error.message}`.trim() : ''
}

async function newUser(label) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const email = `rls-check-${Date.now()}-${label}@example.com`
  const password = `test-${randomUUID()}`

  const { data: signUp, error: signUpError } = await client.auth.signUp({ email, password })
  if (signUpError) throw new Error(`signUp ${label}: ${errText(signUpError)}`)
  if (!signUp.session) {
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) {
      throw new Error(
        `signIn ${label}: ${errText(signInError)}. ` +
          'Disable "Confirm email" in the test project so the script can sign in.',
      )
    }
  }
  return { client, email }
}

async function createShop(client, label) {
  const { data, error } = await client.rpc('create_shop', { p_name: `RLS check ${label}` })
  if (error) throw new Error(`create_shop ${label}: ${errText(error)}`)
  return data
}

async function addProduct(client, shopId, name) {
  const { data, error } = await client
    .from('products')
    .insert({ shop_id: shopId, name, unit: 'kg', sell_price: 55.99, stock_qty: 10 })
    .select('id')
    .single()
  if (error) throw new Error(`insert product ${name}: ${errText(error)}`)
  return data.id
}

async function main() {
  console.log(`RLS check against ${url}`)

  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const userA = await newUser('a')
  const userB = await newUser('b')

  const shopA = await createShop(userA.client, 'A')
  const shopB = await createShop(userB.client, 'B')
  const productA = await addProduct(userA.client, shopA, 'RLS Rice A')
  await addProduct(userB.client, shopB, 'RLS Rice B')

  console.log('\nOwner access')
  {
    const { data, error } = await userA.client.from('products').select('id').eq('shop_id', shopA)
    check('A reads its own product', !error && data?.length === 1, errText(error))
    const { data: shop, error: shopError } = await userA.client
      .from('shops')
      .select('id')
      .eq('id', shopA)
    check('A reads its own shop', !shopError && shop?.length === 1, errText(shopError))
  }

  console.log('\nCross-shop isolation (B vs shop A)')
  {
    const { data: products, error: productsError } = await userB.client
      .from('products')
      .select('id')
      .eq('shop_id', shopA)
    check('B cannot read shop A products', !productsError && products?.length === 0, errText(productsError))

    const { data: bills, error: billsError } = await userB.client
      .from('bills')
      .select('id')
      .eq('shop_id', shopA)
    check('B cannot read shop A bills', !billsError && bills?.length === 0, errText(billsError))

    const { data: shops, error: shopsError } = await userB.client
      .from('shops')
      .select('id')
      .eq('id', shopA)
    check('B cannot read shop A shop row', !shopsError && shops?.length === 0, errText(shopsError))

    const { error: insertError } = await userB.client
      .from('products')
      .insert({ shop_id: shopA, name: 'Injected by B', sell_price: 1 })
    check('B cannot insert a product into shop A', Boolean(insertError), 'insert was allowed')

    const { data: updated, error: updateError } = await userB.client
      .from('products')
      .update({ stock_qty: 0 })
      .eq('id', productA)
      .select('id')
    check(
      'B cannot update a shop A product',
      !updateError && updated?.length === 0,
      errText(updateError) || `${updated?.length ?? 0} row(s) updated`,
    )

    const { error: billError } = await userB.client.rpc('create_bill', {
      p_bill_id: randomUUID(),
      p_shop_id: shopA,
      p_items: [{ product_id: productA, qty: 1, unit_price: 55.99 }],
    })
    check('B cannot create a bill in shop A', Boolean(billError), 'create_bill was allowed')

    const { data: ownProducts, error: ownError } = await userB.client
      .from('products')
      .select('id')
      .eq('shop_id', shopB)
    check('B still sees its own product', !ownError && ownProducts?.length === 1, errText(ownError))
  }

  console.log('\nAnonymous access')
  {
    const { data: products, error: productsError } = await anon
      .from('products')
      .select('id')
      .eq('shop_id', shopA)
    check('anon reads no products', !productsError && products?.length === 0, errText(productsError))

    const { data: bills, error: billsError } = await anon
      .from('bills')
      .select('id')
      .eq('shop_id', shopA)
    check('anon reads no bills', !billsError && bills?.length === 0, errText(billsError))

    const { data: shops, error: shopsError } = await anon.from('shops').select('id')
    check('anon reads no shops', !shopsError && shops?.length === 0, errText(shopsError))

    const { error: insertError } = await anon
      .from('products')
      .insert({ shop_id: shopA, name: 'Injected anon', sell_price: 1 })
    check('anon cannot insert a product', Boolean(insertError), 'insert was allowed')

    const { error: billError } = await anon.rpc('create_bill', {
      p_bill_id: randomUUID(),
      p_shop_id: shopA,
      p_items: [{ product_id: productA, qty: 1, unit_price: 55.99 }],
    })
    check('anon cannot call create_bill', Boolean(billError), 'create_bill was allowed')

    const { error: shopError } = await anon.rpc('create_shop', { p_name: 'Anon shop' })
    check('anon cannot call create_shop', Boolean(shopError), 'create_shop was allowed')
  }

  console.log('\ncreate_bill idempotency')
  {
    const billId = randomUUID()
    const items = [{ product_id: productA, qty: 2, unit_price: 55.99 }]

    const first = await userA.client.rpc('create_bill', { p_bill_id: billId, p_shop_id: shopA, p_items: items })
    const second = await userA.client.rpc('create_bill', { p_bill_id: billId, p_shop_id: shopA, p_items: items })
    check('first create_bill succeeds', !first.error && first.data === billId, errText(first.error))
    check('repeat create_bill returns the same id', !second.error && second.data === billId, errText(second.error))

    const { data: bills, error: billsError } = await userA.client
      .from('bills')
      .select('id, bill_no, subtotal, total')
      .eq('id', billId)
    check('exactly one bill exists', !billsError && bills?.length === 1, errText(billsError))
    check('stored total is 111.98', bills?.[0]?.total === '111.98', `got ${bills?.[0]?.total}`)

    const { data: itemsRows, error: itemsError } = await userA.client
      .from('bill_items')
      .select('id')
      .eq('bill_id', billId)
    check('exactly one bill item exists', !itemsError && itemsRows?.length === 1, errText(itemsError))

    const { data: moves, error: movesError } = await userA.client
      .from('stock_movements')
      .select('id')
      .eq('ref_bill_id', billId)
    check('exactly one stock movement exists', !movesError && moves?.length === 1, errText(movesError))

    const { data: product, error: productError } = await userA.client
      .from('products')
      .select('stock_qty')
      .eq('id', productA)
      .single()
    check('stock went down once (10 -> 8)', !productError && Number(product?.stock_qty) === 8, `got ${product?.stock_qty}`)

    const { data: seenByB, error: seenError } = await userB.client
      .from('bills')
      .select('id')
      .eq('id', billId)
    check('B cannot see the new bill', !seenError && seenByB?.length === 0, errText(seenError))
  }

  console.log('\nLeftover test data (delete with service role if needed):')
  console.log(`  users: ${userA.email}, ${userB.email}`)
  console.log(`  shops: ${shopA}, ${shopB}`)

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`)
    process.exit(1)
  }
  console.log('\nAll RLS checks passed')
}

main().catch((err) => {
  console.error(`\nRLS check crashed: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
