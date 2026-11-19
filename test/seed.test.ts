import {describe, expect, it} from "bun:test"
import {demoTables} from "../src/lib/seed"

describe(`demoTables — the seeded dataset`, () => {
  it(`has exactly the three documented tables`, () => {
    const tables = demoTables()
    expect(tables.map((t) => t.name)).toEqual([`customers`, `products`, `orders`])
    expect(tables[0]!.rows.length).toBe(12)
    expect(tables[1]!.rows.length).toBe(10)
    expect(tables[2]!.rows.length).toBe(16)
  })

  it(`has four customers from Jakarta`, () => {
    const customers = demoTables()[0]!
    expect(customers.rows.filter((r) => r.city === `Jakarta`).length).toBe(4)
  })

  it(`has exactly one product out of stock`, () => {
    const products = demoTables()[1]!
    expect(products.rows.filter((r) => r.stock === 0).map((r) => r.name)).toEqual([`Green Tea Box`])
  })

  it(`order totals match quantity x product price`, () => {
    const tables = demoTables()
    const prices = new Map(tables[1]!.rows.map((r) => [r.id, r.price as number]))
    for (const order of tables[2]!.rows) {
      expect(order.total).toBe((order.quantity as number) * prices.get(order.product_id)!)
    }
  })
})
