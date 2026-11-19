import {mkdtempSync} from "node:fs"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {afterAll, beforeAll, describe, expect, it} from "bun:test"
import {Db} from "../src/db"
import {DbChatService} from "../src/lib/dbchat"

let db: Db

beforeAll(async () => {
  db = new Db(join(mkdtempSync(join(tmpdir(), `dbchat-mock-`)), `data`))
  await db.ensureSeeded()
})

afterAll(async () => {
  await db.close()
})

describe(`DbChatService.chat — mock mode (no OpenAI key)`, () => {
  it(`lists the tables from the real dataset`, async () => {
    const reply = await DbChatService.chat(db, 1, `Which tables are available?`)
    expect(reply.via).toBe(`mock`)
    expect(reply.kind).toBe(`mock-tables`)
    expect(reply.lines.length).toBe(3)
    expect(reply.lines[0]).toContain(`customers — 12 rows`)
  })

  it(`counts orders`, async () => {
    const reply = await DbChatService.chat(db, 1, `How many orders are there?`)
    expect(reply.kind).toBe(`mock-query`)
    expect(reply.lines).toEqual([`• count: 16`])
  })

  it(`totals revenue by product with product names, highest first`, async () => {
    const reply = await DbChatService.chat(db, 1, `Total revenue by product?`)
    expect(reply.kind).toBe(`mock-query`)
    expect(reply.lines[0]).toBe(`• Running Shoes: 3,897,000`)
    expect(reply.lines.length).toBe(9)
  })

  it(`lists customers from Jakarta`, async () => {
    const reply = await DbChatService.chat(db, 1, `List customers from Jakarta`)
    expect(reply.kind).toBe(`mock-query`)
    expect(reply.total).toBe(4)
    expect(reply.lines.length).toBe(5)
    expect(reply.lines[1]).toContain(`Andi Pratama`)
  })

  it(`describes a table`, async () => {
    const reply = await DbChatService.chat(db, 1, `Describe products`)
    expect(reply.kind).toBe(`mock-describe`)
    expect(reply.table).toBe(`products`)
    expect(reply.lines).toContain(`• price (number) — price in IDR`)
  })

  it(`echoes an unmatched question and stores both turns in memory`, async () => {
    const reply = await DbChatService.chat(db, 2, `hello there`)
    expect(reply.kind).toBe(`mock-echo`)
    expect(reply.turns).toBe(1)
    expect(db.memory.list(2).length).toBe(2)
  })

  it(`runTool reports an unknown table instead of inventing one`, async () => {
    const section = await DbChatService.runTool(db, `describe_table`, {table: `invoices`})
    expect(section.code).toBe(`unknown-table`)
    expect(section.detail).toBe(`invoices`)
  })
})
