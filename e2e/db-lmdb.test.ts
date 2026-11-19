import {beforeEach, describe, expect, it} from "bun:test"
import {bot, dbUser, e2e, resetEnv} from "./setup"

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
})

describe(`e2e: LMDB repositories (direct)`, () => {
  it(`user createIfNotExists is idempotent`, async () => {
    // data-e2e persists across runs, so the row may already exist from a
    // previous run — assert idempotency, not first-run creation.
    await bot.db.user.createIfNotExists(4101, {username: `dbuser`, firstName: `Db`})
    const second = await bot.db.user.createIfNotExists(4101, {username: `dbuser`, firstName: `Db`})
    expect(second.created).toBe(false)
    expect(second.user.username).toBe(`dbuser`)
    expect(bot.db.user.count()).toBeGreaterThanOrEqual(1)
  })

  it(`demo dataset is seeded: 3 tables with the documented row counts`, async () => {
    const tables = await bot.db.tables.list()
    expect(tables.map((t) => t.name)).toEqual([`customers`, `orders`, `products`])
    expect(await bot.db.tables.count(`customers`)).toBe(12)
    expect(await bot.db.tables.count(`products`)).toBe(10)
    expect(await bot.db.tables.count(`orders`)).toBe(16)
    const orders = await bot.db.tables.get(`orders`)
    expect(orders?.columns.map((c) => c.name)).toEqual([`id`, `customer_id`, `product_id`, `quantity`, `total`, `ordered_at`])
  })

  it(`ensureSeeded is idempotent — a second call seeds nothing`, async () => {
    expect(await bot.db.ensureSeeded()).toBe(false)
    expect((await bot.db.tables.list()).length).toBe(3)
  })

  it(`memory clear wipes the window`, async () => {
    await bot.db.memory.add(4101, {role: `user`, text: `halo`, at: Date.now()})
    expect(bot.db.memory.list(4101).length).toBe(1)
    await bot.db.memory.clear(4101)
    expect(bot.db.memory.list(4101).length).toBe(0)
  })

  it(`db usage reports map size`, async () => {
    const usage = bot.db.usage()
    expect(usage.total).toBeGreaterThan(0)
    void dbUser
  })
})
