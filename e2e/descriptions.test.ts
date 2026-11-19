import {beforeEach, describe, expect, it} from "bun:test"
import {bot, e2e} from "./setup"

/**
 * `<g-description>` sync: every command page declares its BotFather
 * description in its OWN template's default `<g-base>` (EN default +
 * `lang="id"`). On bot start the framework calls
 * `executeSyncBlocksDescription`, which resolves each command through
 * `getGDescription` and syncs via `setMyCommands` per language.
 *
 * NOTE (framework finding, 2026-11-19): descriptions CANNOT be
 * centralized in start/index.ts — the sync reads
 * `getGDescription("<page-name>", "default", lang, scope)`, so a
 * description placed in start's template would only ever sync /start.
 * Each page carries its own block; this test proves the sync sees all 6.
 */
const EN: Record<string, string> = {
  forget: `Erase my memory of this chat`,
  help: `Full help and command list`,
  language: `Switch language (English / Indonesia)`,
  schema: `Show the columns of a table`,
  start: `Introduction and main menu`,
  tables: `List all tables with row counts`,
}

const ID: Record<string, string> = {
  forget: `Hapus ingatanku tentang obrolan ini`,
  help: `Bantuan lengkap dan daftar perintah`,
  language: `Ganti bahasa (English / Indonesia)`,
  schema: `Tampilkan kolom sebuah tabel`,
  start: `Perkenalan dan menu utama`,
  tables: `Daftar semua tabel beserta jumlah barisnya`,
}

function commandsOf(call: {body?: {commands?: {command: string; description: string}[]}}): {command: string; description: string}[] {
  return call.body?.commands ?? []
}

describe(`E2E: <g-description> sync (BotFather command list)`, () => {
  beforeEach(() => {
    e2e.clearCalls()
  })

  it(`syncs exactly 6 commands, once each, in English (default) and Indonesian`, async () => {
    await bot.executeSyncBlocksDescription(bot.pages)
    const calls = e2e.calls.filter((c) => c.method === `setMyCommands`)
    expect(calls.length).toBe(2)

    const def = calls.find((c) => (c as {body?: {language_code?: string}}).body?.language_code === undefined)!
    const id = calls.find((c) => (c as {body?: {language_code?: string}}).body?.language_code === `id`)!
    expect(def).toBeDefined()
    expect(id).toBeDefined()

    // One entry per command — commands are English-only, one intent per
    // page, so the framework's own sync must list each command once.
    const enCommands = commandsOf(def as never)
    const idCommands = commandsOf(id as never)
    expect(enCommands.length).toBe(6)
    expect(idCommands.length).toBe(6)
    expect(new Set(enCommands.map((c) => c.command)).size).toBe(6)
    expect(new Set(idCommands.map((c) => c.command)).size).toBe(6)

    const byName = (list: {command: string; description: string}[]) =>
      Object.fromEntries(list.map((c) => [c.command, c.description]))
    expect(byName(enCommands)).toEqual(EN)
    expect(byName(idCommands)).toEqual(ID)
  })
})
