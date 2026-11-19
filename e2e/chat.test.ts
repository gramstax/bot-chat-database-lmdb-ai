import {beforeEach, describe, expect, it} from "bun:test"
import {bot, chatEnUser, chatMemoryUser, chatUser, e2e, resetEnv} from "./setup"

const intent = `chat`

/** Full data object the Chat page passes to its template (see toTemplateData). */
const base = {
  reply: ``,
  text: ``,
  turns: 0,
  table: ``,
  total: 0,
  code: ``,
  detail: ``,
  lines: [] as string[],
}

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
})

describe(`E2E: ChatPage — free text, mock mode`, () => {
  it(`answers "Which tables are available?" from the real LMDB dataset (Indonesian)`, async () => {
    const responses = await e2e.sendText(`Which tables are available?`, chatUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {
        ...base,
        kind: `mock-tables`,
        lines: [
          `• customers — 12 rows — People who buy from the store`,
          `• orders — 16 rows — Customer purchases (total = quantity x product price)`,
          `• products — 10 rows — Items the store sells (prices in IDR)`,
        ],
      }, `id`),
    )
    expect(bot.db.memory.list(4401).length).toBe(2)
  })

  it(`answers "How many orders are there?" with a real count (English)`, async () => {
    const responses = await e2e.sendText(`How many orders are there?`, chatEnUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {...base, kind: `mock-query`, table: `orders`, total: 16, lines: [`• count: 16`]}, `en`),
    )
  })

  it(`answers "Total revenue by product?" with labeled grouped sums`, async () => {
    const responses = await e2e.sendText(`Total revenue by product?`, chatUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {
        ...base,
        kind: `mock-query`,
        table: `orders`,
        total: 16,
        lines: [
          `• Running Shoes: 3,897,000`,
          `• Standing Desk: 3,299,000`,
          `• Mechanical Keyboard: 1,798,000`,
          `• Office Chair: 1,499,000`,
          `• Wireless Mouse: 1,494,000`,
          `• USB-C Hub: 1,197,000`,
          `• Arabica Coffee 250g: 850,000`,
          `• Cotton T-Shirt: 596,000`,
          `• Desk Lamp: 558,000`,
        ],
      }, `id`),
    )
  })

  it(`answers "List customers from Jakarta" with the four matching rows`, async () => {
    const responses = await e2e.sendText(`List customers from Jakarta`, chatUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {
        ...base,
        kind: `mock-query`,
        table: `customers`,
        total: 4,
        lines: [
          `id | name | email | city | created_at`,
          `1 | Andi Pratama | andi@mail.com | Jakarta | 2026-09-02`,
          `2 | Sari Wijaya | sari@mail.com | Jakarta | 2026-09-05`,
          `4 | Maya Chen | maya@mail.com | Jakarta | 2026-09-11`,
          `9 | Agus Setiawan | agus@mail.com | Jakarta | 2026-09-26`,
        ],
      }, `id`),
    )
  })

  it(`answers "Describe orders" with the real columns`, async () => {
    const responses = await e2e.sendText(`Describe orders`, chatUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {
        ...base,
        kind: `mock-describe`,
        table: `orders`,
        lines: [
          `• id (integer)`,
          `• customer_id (integer) — references customers.id`,
          `• product_id (integer) — references products.id`,
          `• quantity (integer)`,
          `• total (number) — total in IDR`,
          `• ordered_at (date)`,
        ],
      }, `id`),
    )
  })

  it(`echoes an unmatched question and remembers the turn (English)`, async () => {
    const responses = await e2e.sendText(`hello there`, chatEnUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toBe(
      e2e.gmsg(intent, `default`, {...base, kind: `mock-echo`, text: `hello there`, turns: 1}, `en`),
    )
    expect(bot.db.memory.list(4403).length).toBe(2)
  })

  it(`remembers context across turns: turn 2 sees turn 1 in memory`, async () => {
    await e2e.sendText(`Which tables are available?`, chatMemoryUser)
    e2e.clearCalls()
    const responses = await e2e.sendText(`How many orders are there?`, chatMemoryUser)
    expect(responses.length).toBeGreaterThan(0)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toContain(`count: 16`)
    // Window buffer: 2 question-answer turns = 4 stored rows.
    expect(bot.db.memory.list(4402).length).toBe(4)
  })

  it(`sends a typing indicator before the chat reply`, async () => {
    const responses = await e2e.sendText(`Which tables are available?`, chatUser)
    expect(responses.map((c) => c.method)).toContain(`sendChatAction`)
  })
})
