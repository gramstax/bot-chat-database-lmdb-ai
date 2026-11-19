import {beforeEach, describe, expect, it} from "bun:test"
import {e2e, resetEnv, tablesEnUser, tablesUser} from "./setup"

const intent = `tables`

const TABLES = [
  {name: `customers`, count: 12, description: `People who buy from the store`},
  {name: `orders`, count: 16, description: `Customer purchases (total = quantity x product price)`},
  {name: `products`, count: 10, description: `Items the store sells (prices in IDR)`},
]

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
})

describe(`E2E: TablesPage`, () => {
  it(`lists all tables with row counts (Indonesian)`, async () => {
    const responses = await e2e.sendText(`/tables`, tablesUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(e2e.gmsg(intent, `default`, {state: `list`, tables: TABLES}, `id`))
  })

  it(`lists all tables with row counts (English)`, async () => {
    const responses = await e2e.sendText(`/tables`, tablesEnUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(e2e.gmsg(intent, `default`, {state: `list`, tables: TABLES}, `en`))
  })

  it(`opens from the Tables button on /start`, async () => {
    await e2e.sendText(`/start`, tablesUser)
    e2e.clearCalls()
    const responses = await e2e.sendCallbackQuery(`tables`, tablesUser)
    expect(responses.map((c) => c.method)).toContain(`editMessageText`)
    expect(e2e.extractText(e2e.lastCall(`editMessageText`)!)).toContain(`customers — 12 baris`)
  })
})
