import {beforeEach, describe, expect, it} from "bun:test"
import {e2e, resetEnv, schemaEnUser, schemaUser} from "./setup"

const intent = `schema`

const ORDER_COLUMNS = [
  `• id (integer)`,
  `• customer_id (integer) — references customers.id`,
  `• product_id (integer) — references products.id`,
  `• quantity (integer)`,
  `• total (number) — total in IDR`,
  `• ordered_at (date)`,
]

const TABLE_LINES = [`• customers`, `• orders`, `• products`]

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
})

describe(`E2E: SchemaPage`, () => {
  it(`describes the orders table (Indonesian)`, async () => {
    const responses = await e2e.sendText(`/schema orders`, schemaUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {state: `ok`, table: `orders`, count: 16, lines: ORDER_COLUMNS}, `id`),
    )
  })

  it(`describes the products table (English)`, async () => {
    const responses = await e2e.sendText(`/schema products`, schemaEnUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {
        state: `ok`,
        table: `products`,
        count: 10,
        lines: [
          `• id (integer)`,
          `• name (string)`,
          `• category (string)`,
          `• price (number) — price in IDR`,
          `• stock (integer)`,
        ],
      }, `en`),
    )
  })

  it(`/schema without an argument lists the available tables`, async () => {
    const responses = await e2e.sendText(`/schema`, schemaUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {state: `prompt`, table: ``, count: 0, lines: TABLE_LINES}, `id`),
    )
  })

  it(`unknown table names are answered honestly`, async () => {
    const responses = await e2e.sendText(`/schema invoices`, schemaUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {state: `unknown`, table: `invoices`, count: 0, lines: []}, `id`),
    )
  })
})
