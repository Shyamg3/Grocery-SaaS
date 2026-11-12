import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }))

vi.mock('../src/lib/supabase', () => ({
  supabase: { rpc: rpcMock, from: vi.fn() },
}))

import { db } from '../src/db/db'
import { enqueueBill, flushOutbox } from '../src/db/sync'

const draft = {
  items: [{ productId: 'p1', qty: 2, unitPricePaise: 5599 }],
  payment: 'cash' as const,
}

beforeEach(async () => {
  rpcMock.mockReset()
  await db.delete().catch(() => undefined)
  await db.open()
})

describe('outbox', () => {
  it('adds a bill with a client-generated UUID as p_bill_id', async () => {
    const id = await enqueueBill('shop-1', draft)
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    const rows = await db.outbox.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe('pending')
    expect(rows[0].attempts).toBe(0)
    expect(rows[0].items).toEqual([{ product_id: 'p1', qty: 2, unit_price: '55.99' }])
  })

  it('keeps the row and increments attempts on a network failure', async () => {
    rpcMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const id = await enqueueBill('shop-1', draft)
    await flushOutbox()
    const row = await db.outbox.get(id)
    expect(row?.status).toBe('pending')
    expect(row?.attempts).toBe(1)
    expect(row?.lastError).toContain('fetch')
    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock.mock.calls[0][1].p_bill_id).toBe(id)
  })

  it('marks a row as error when the server rejects the bill', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'product X not found in this shop' } })
    const id = await enqueueBill('shop-1', draft)
    await flushOutbox()
    const row = await db.outbox.get(id)
    expect(row?.status).toBe('error')
    expect(row?.attempts).toBe(1)
  })

  it('removes the row after a successful push', async () => {
    rpcMock.mockResolvedValue({ data: 'ok', error: null })
    const id = await enqueueBill('shop-1', draft)
    await flushOutbox()
    expect(await db.outbox.get(id)).toBeUndefined()
    expect(rpcMock).toHaveBeenCalledTimes(1)
    const args = rpcMock.mock.calls[0][1]
    expect(args.p_shop_id).toBe('shop-1')
    expect(args.p_payment).toBe('cash')
    expect(args.p_discount).toBe('0.00')
  })

  it('a retried duplicate never creates a second bill (idempotent RPC)', async () => {
    // mirrors create_bill's "if exists return p_bill_id" guard
    const inserted = new Set<string>()
    rpcMock.mockImplementation(async (_fn: string, args: { p_bill_id: string }) => {
      inserted.add(args.p_bill_id)
      return { data: args.p_bill_id, error: null }
    })
    const id = await enqueueBill('shop-1', draft)
    const row = await db.outbox.get(id)
    await flushOutbox()
    expect(await db.outbox.toArray()).toHaveLength(0)

    // simulate a crash between the RPC committing and the outbox row being deleted
    await db.outbox.put(row!)
    await flushOutbox()

    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock.mock.calls[0][1].p_bill_id).toBe(id)
    expect(rpcMock.mock.calls[1][1].p_bill_id).toBe(id)
    expect(inserted).toHaveLength(1)
    expect(await db.outbox.toArray()).toHaveLength(0)
  })
})
