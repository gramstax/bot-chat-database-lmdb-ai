import {beforeEach, describe, expect, it} from "bun:test"
import {bot, coverageUser, deniedUser, e2e, noUsernameUser, resetEnv} from "./setup"

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
  process.env.DBCHAT_ALLOWED_IDS = ``
})

describe(`coverage: AllowList guard (hookBeforeRoute)`, () => {
  it(`denies a user not on DBCHAT_ALLOWED_IDS and explains why`, async () => {
    process.env.DBCHAT_ALLOWED_IDS = `4952`
    try {
      const responses = await e2e.sendText(`/start`, deniedUser)
      expect(responses.length).toBeGreaterThan(0)
      expect(responses[0]!.method).toBe(`sendMessage`)
      expect(e2e.extractText(responses[0]!)).toContain(`hanya melayani pengguna yang diizinkan`)
      expect(e2e.extractText(responses[0]!)).not.toContain(`aku DB Chat`)
    } finally {
      process.env.DBCHAT_ALLOWED_IDS = ``
    }
  })

  it(`allows a user on DBCHAT_ALLOWED_IDS`, async () => {
    process.env.DBCHAT_ALLOWED_IDS = `4952`
    try {
      const responses = await e2e.sendText(`/start`, coverageUser)
      const reply = e2e.lastCall(`sendMessage`)!
      expect(reply).toBeDefined()
      expect(e2e.extractText(reply)).toContain(`aku DB Chat`)
    } finally {
      process.env.DBCHAT_ALLOWED_IDS = ``
    }
  })

  it(`allows a user without a Telegram username (no username guard)`, async () => {
    const responses = await e2e.sendText(`/start`, noUsernameUser)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(reply).toBeDefined()
    expect(e2e.extractText(reply)).toContain(`aku DB Chat`)
  })
})

describe(`coverage: memory window cap`, () => {
  it(`memory keeps only the last 10 turns`, async () => {
    for (let i = 1; i <= 12; i++) {
      await bot.db.memory.add(4952, {role: i % 2 === 0 ? `assistant` : `user`, text: `turn ${i}`, at: Date.now()})
    }
    const turns = bot.db.memory.list(4952)
    expect(turns.length).toBe(10)
    expect(turns[0]!.text).toBe(`turn 3`)
    expect(turns[9]!.text).toBe(`turn 12`)
  })
})
