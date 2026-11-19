import {mkdtempSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {afterAll, beforeAll, describe, expect, it} from "bun:test"
import {Db} from "../src/db"
import {QueryExecutor} from "../src/lib/query"

let db: Db

beforeAll(async () => {
  db = new Db(join(mkdtempSync(join(tmpdir(), `dbchat-query-`)), `data`))
  await db.ensureSeeded()
})

afterAll(async () => {
  await db.close()
})

describe(`QueryExecutor — structured read-only queries over LMDB`, () => {
  it(`counts all orders`, async () => {
    const out = await QueryExecutor.run(db, {table: `orders`, aggregate: {fn: `count`}})
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.aggregate?.value).toBe(16)
    expect(out.result.total).toBe(16)
  })

  it(`filters customers by city (Jakarta = 4)`, async () => {
    const out = await QueryExecutor.run(db, {
      table: `customers`,
      filters: [{field: `city`, op: `eq`, value: `Jakarta`}],
    })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.total).toBe(4)
    expect(out.result.rows.map((r) => r.name)).toEqual([`Andi Pratama`, `Sari Wijaya`, `Maya Chen`, `Agus Setiawan`])
  })

  it(`sums total revenue across all orders`, async () => {
    const out = await QueryExecutor.run(db, {table: `orders`, aggregate: {fn: `sum`, field: `total`}})
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.aggregate?.value).toBe(15188000)
  })

  it(`groups revenue by product, highest first`, async () => {
    const out = await QueryExecutor.run(db, {table: `orders`, aggregate: {fn: `sum`, field: `total`}, groupBy: `product_id`})
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.grouped?.[0]).toEqual({key: `7`, value: 3897000})
    expect(out.result.grouped?.length).toBe(9)
  })

  it(`sorts by total descending and respects the limit`, async () => {
    const out = await QueryExecutor.run(db, {table: `orders`, sortBy: `total`, sortDir: `desc`, limit: 3})
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.rows.map((r) => r.id)).toEqual([9, 14, 6])
    expect(out.result.total).toBe(16)
  })

  it(`rejects an unknown table`, async () => {
    const out = await QueryExecutor.run(db, {table: `invoices`})
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.code).toBe(`unknown-table`)
  })

  it(`rejects an unknown field`, async () => {
    const out = await QueryExecutor.run(db, {table: `customers`, filters: [{field: `planet`, op: `eq`, value: `Mars`}]})
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.code).toBe(`unknown-field`)
  })

  it(`rejects a limit above the cap`, async () => {
    const out = await QueryExecutor.run(db, {table: `customers`, limit: 100})
    expect(out.ok).toBe(false)
    if (out.ok) return
    expect(out.code).toBe(`bad-limit`)
  })

  it(`contains matches case-insensitively`, async () => {
    const out = await QueryExecutor.run(db, {table: `products`, filters: [{field: `name`, op: `contains`, value: `coffee`}]})
    expect(out.ok).toBe(true)
    if (!out.ok) return
    expect(out.result.total).toBe(1)
    expect(out.result.rows[0]?.name).toBe(`Arabica Coffee 250g`)
  })
})
