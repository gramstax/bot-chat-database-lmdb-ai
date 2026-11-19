import {beforeEach, describe, expect, it} from "bun:test"
import {bot, chatUser, e2e, forgetUser, resetEnv} from "./setup"

const intent = `forget`

beforeEach(async () => {
  e2e.clearCalls()
  await resetEnv()
})

describe(`E2E: ForgetPage`, () => {
  it(`clears the user's conversation memory and confirms`, async () => {
    await e2e.sendText(`Which tables are available?`, forgetUser)
    expect(bot.db.memory.list(4901).length).toBe(2)
    e2e.clearCalls()
    const responses = await e2e.sendText(`/forget`, forgetUser)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(e2e.extractText(reply)).toBe(e2e.gmsg(intent, `default`, {}, `id`))
    expect(bot.db.memory.list(4901).length).toBe(0)
  })

  it(`after /forget, the chat starts from zero again`, async () => {
    await e2e.sendText(`Which tables are available?`, forgetUser)
    await e2e.sendText(`/forget`, forgetUser)
    e2e.clearCalls()
    const responses = await e2e.sendText(`hello`, forgetUser)
    const reply = e2e.lastCall(`sendMessage`)!
    expect(e2e.extractText(reply)).toContain(`Kamu bilang: "hello"`)
    expect(bot.db.memory.list(4901).length).toBe(2)
    void chatUser
  })
})
