import type {Db} from "~/db"
import {AppConfig} from "~/lib/config"
import {Dates} from "~/lib/dates"
import type {Lang} from "~/lib/lang"
import {OpenAIClient, type IChatMessage, type IChatTool} from "~/lib/openai"
import {QueryExecutor} from "~/lib/query"
import type {IStructuredQuery, ITable, ITurn} from "~/types/dbchat"

export type ToolName = `list_tables` | `describe_table` | `run_query`

/**
 * One tool's outcome as DATA, not words: preformatted item lines and a
 * machine-readable error `code`. The page's static template renders the
 * label, the empty sentence, and the error sentence in the user's
 * language — this file never holds those sentences (strict rule, Damar
 * 2026-11-19 ~14:43 WIB: no string dictionary, localize via
 * `static template` blocks).
 */
export interface IToolSection {
  tool: string
  connected: boolean
  code?: string
  /** Machine-readable detail for the error (e.g. the unknown table name). */
  detail?: string
  /** Rows matched by a run_query, before the limit (for the template). */
  total?: number
  lines: string[]
}

export type DbChatReplyKind =
  | `live`
  | `live-exhausted`
  | `live-noanswer`
  | `mock-tables`
  | `mock-describe`
  | `mock-query`
  | `mock-query-empty`
  | `mock-error`
  | `mock-echo`

export interface IDbChatReply {
  /** Flat render key: the page template switches on this, one case per kind. */
  kind: DbChatReplyKind
  /** Live LLM text — only when kind === `live`. */
  reply: string
  /** mock-echo: the user's text. */
  text?: string
  /** mock-echo: turn count. */
  turns?: number
  /** mock-describe / mock-query: the table the answer is about. */
  table?: string
  /** mock-error: the executor's error code. */
  code?: string
  /** mock-error: the detail (unknown table/field name). */
  detail?: string
  /** mock-query: "16 rows" style count line for the template. */
  total?: number
  /** Render lines (tables, columns, or result rows). */
  lines: string[]
  /** Names of the tools used on this turn (empty when none were used). */
  toolsUsed: string[]
  /** `openai` = live GPT-4o-mini, `mock` = DBCHAT_MOCK_AI mode / no key. */
  via: `openai` | `mock`
}

const TOOLS: IChatTool[] = [
  {
    type: `function`,
    function: {
      name: `list_tables`,
      description: `List every table in the database with its row count and description. Use it when the user asks which tables are available.`,
      parameters: {type: `object`, properties: {}},
    },
  },
  {
    type: `function`,
    function: {
      name: `describe_table`,
      description: `Show the columns (name and type) of one table.`,
      parameters: {
        type: `object`,
        properties: {table: {type: `string`, description: `Table name, e.g. customers, products, orders`}},
        required: [`table`],
      },
    },
  },
  {
    type: `function`,
    function: {
      name: `run_query`,
      description: `Run a READ-ONLY structured query against one table. Never invent a table or column name — list tables or describe the table first when unsure. The query is a JSON object, never raw SQL.`,
      parameters: {
        type: `object`,
        properties: {
          table: {type: `string`, description: `Table name`},
          filters: {
            type: `array`,
            items: {
              type: `object`,
              properties: {
                field: {type: `string`},
                op: {type: `string`, enum: [`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`]},
                value: {type: [`string`, `number`]},
              },
              required: [`field`, `op`, `value`],
            },
          },
          sortBy: {type: `string`, description: `Column to sort by`},
          sortDir: {type: `string`, enum: [`asc`, `desc`]},
          limit: {type: `integer`, description: `Max rows to return, 1-50, default 10`},
          aggregate: {
            type: `object`,
            properties: {
              fn: {type: `string`, enum: [`count`, `sum`, `avg`, `min`, `max`]},
              field: {type: `string`, description: `Column to aggregate (omit for count)`},
            },
            required: [`fn`],
          },
          groupBy: {type: `string`, description: `Column to group the aggregate by`},
        },
        required: [`table`],
      },
    },
  },
]

/**
 * DB Chat — the conversation core. Flow: free text -> persistent window
 * buffer memory (LMDB, max 10 turns) -> AI agent GPT-4o-mini + 3 tools
 * (list_tables, describe_table, run_query over LMDB) -> reply.
 *
 * Mock mode (DBCHAT_MOCK_AI=1 or no OPENAI_API_KEY): NO OpenAI calls —
 * deterministic structured replies from the real LMDB dataset, so e2e can
 * prove the flow without keys and without inventing data.
 */
export class DbChatService {
  /**
   * LLM system prompt (model instruction, NOT a user-facing message — the
   * user never sees this text, so it stays in code by design). It tells
   * the model which language to answer in and which tables exist.
   */
  static systemPrompt(tables: ITable[], now = new Date(), lang: Lang = `en`): string {
    const dateLine = Dates.jakartaLong(now, lang === `id` ? `id-ID` : `en-GB`)
    const schema = tables
      .map((t) => `- ${t.name} (${t.rows.length} rows): ${t.columns.map((c) => `${c.name} (${c.type})`).join(`, `)}`)
      .join(`\n`)
    const head =
      lang === `id`
        ? [
            `Kamu DB Chat, asisten database yang ramah dan ringkas di Telegram.`,
            `Bahasa: Bahasa Indonesia yang natural dan santai, bukan terjemahan kaku.`,
            `Hari/tanggal saat ini (Asia/Jakarta): ${dateLine}.`,
            `Jawab pertanyaan tentang database dengan tool yang tersedia — jangan mengarang data, tabel, atau kolom.`,
            `Bila data yang ditanya tidak ada di database, katakan dengan jujur.`,
            `Jawaban singkat, langsung ke inti, tanpa markdown berat.`,
          ]
        : [
            `You are DB Chat, a friendly and concise database assistant on Telegram.`,
            `Language: natural, relaxed English.`,
            `Current day/date (Asia/Jakarta): ${dateLine}.`,
            `Answer questions about the database with the available tools — never invent data, tables, or columns.`,
            `When the data asked about is not in the database, say so honestly.`,
            `Keep answers short, to the point, and without heavy markdown.`,
          ]
    return [...head, `Database schema:`, schema].join(`\n`)
  }

  /** Run one tool on the agent's behalf; returns structured data. */
  static async runTool(db: Db, name: string, args: Record<string, unknown>): Promise<IToolSection> {
    switch (name) {
      case `list_tables`: {
        const tables = await db.tables.list()
        return {
          tool: `list_tables`,
          connected: true,
          lines: tables.map((t) => `• ${t.name} — ${t.rows.length} rows — ${t.description}`),
        }
      }
      case `describe_table`: {
        const tableName = typeof args.table === `string` ? args.table : ``
        const table = await db.tables.get(tableName)
        if (!table) return {tool: `describe_table`, connected: true, code: `unknown-table`, detail: tableName, lines: []}
        return {
          tool: `describe_table`,
          connected: true,
          lines: table.columns.map((c) => `• ${c.name} (${c.type})${c.note ? ` — ${c.note}` : ``}`),
        }
      }
      case `run_query`: {
        const parsed = DbChatService.toStructuredQuery(args)
        if (!parsed) return {tool: `run_query`, connected: true, code: `bad-query`, detail: ``, lines: []}
        const outcome = await QueryExecutor.run(db, parsed)
        if (!outcome.ok) {
          return {tool: `run_query`, connected: true, code: outcome.code, detail: outcome.detail, lines: []}
        }
        return {tool: `run_query`, connected: true, total: outcome.result.total, lines: DbChatService.formatResult(db, outcome.result)}
      }
      default:
        return {tool: name, connected: true, code: `unknown-tool`, detail: name, lines: []}
    }
  }

  /**
   * Turn a tool-call argument object into a structured query. Returns
   * undefined when the shape is not a valid query object at all — the
   * executor then never runs, and the caller reports `bad-query`.
   */
  static toStructuredQuery(args: Record<string, unknown>): IStructuredQuery | undefined {
    if (typeof args.table !== `string` || !args.table) return undefined
    const query: IStructuredQuery = {table: args.table}
    if (Array.isArray(args.filters)) {
      const filters = args.filters.filter(
        (f): f is {field: string; op: string; value: string | number} =>
          typeof f === `object` &&
          f !== null &&
          typeof (f as {field?: unknown}).field === `string` &&
          typeof (f as {op?: unknown}).op === `string` &&
          (typeof (f as {value?: unknown}).value === `string` || typeof (f as {value?: unknown}).value === `number`),
      )
      query.filters = filters.map((f) => ({
        field: f.field,
        op: f.op as `eq` | `ne` | `gt` | `gte` | `lt` | `lte` | `contains`,
        value: f.value,
      }))
    }
    if (typeof args.sortBy === `string`) query.sortBy = args.sortBy
    if (args.sortDir === `asc` || args.sortDir === `desc`) query.sortDir = args.sortDir
    if (typeof args.limit === `number`) query.limit = args.limit
    if (typeof args.aggregate === `object` && args.aggregate !== null) {
      const agg = args.aggregate as {fn?: unknown; field?: unknown}
      if (typeof agg.fn === `string`) {
        query.aggregate = {
          fn: agg.fn as `count` | `sum` | `avg` | `min` | `max`,
          field: typeof agg.field === `string` ? agg.field : undefined,
        }
      }
    }
    if (typeof args.groupBy === `string`) query.groupBy = args.groupBy
    return query
  }

  /** Render a query result as display lines (data only, no sentences). */
  static formatResult(
    db: Db,
    result: {table: string; columns: string[]; rows: Record<string, unknown>[]; total: number; aggregate?: {fn: string; field?: string; value: number}; grouped?: {key: string; value: number}[]},
  ): string[] {
    const lines: string[] = []
    if (result.grouped !== undefined) {
      for (const g of result.grouped) lines.push(`• ${g.key}: ${DbChatService.formatNumber(g.value)}`)
      return lines
    }
    if (result.aggregate !== undefined) {
      const a = result.aggregate
      lines.push(`• ${a.fn}${a.field ? `(${a.field})` : ``}: ${DbChatService.formatNumber(a.value)}`)
      return lines
    }
    lines.push(result.columns.join(` | `))
    for (const row of result.rows) {
      lines.push(result.columns.map((c) => DbChatService.formatCell(row[c])).join(` | `))
    }
    if (result.total > result.rows.length) lines.push(`… ${result.total - result.rows.length} more rows`)
    return lines
  }

  /** Group-by keys that are foreign ids are shown as the referenced name. */
  static async labelGroupedKeys(db: Db, table: string, groupBy: string, grouped: {key: string; value: number}[]): Promise<{key: string; value: number}[]> {
    if (table !== `orders` || groupBy !== `product_id`) return grouped
    const products = await db.tables.get(`products`)
    if (!products) return grouped
    const names = new Map(products.rows.map((r) => [String(r.id), String(r.name)]))
    return grouped.map((g) => ({key: names.get(g.key) ?? g.key, value: g.value}))
  }

  private static formatCell(value: unknown): string {
    if (value === undefined || value === null) return `-`
    if (typeof value === `number`) return DbChatService.formatNumber(value)
    return String(value)
  }

  private static formatNumber(value: number): string {
    return Number.isInteger(value) ? value.toLocaleString(`en-US`) : value.toLocaleString(`en-US`, {maximumFractionDigits: 2})
  }

  /**
   * Render a tool section as MODEL input (live mode only). The user never
   * sees this text — the model paraphrases it — so it stays a compact
   * data token, not a localized sentence.
   */
  static formatForModel(section: IToolSection): string {
    if (section.code !== undefined) return `(tool error: ${section.code}${section.detail ? ` ${section.detail}` : ``})`
    return section.lines.length > 0 ? section.lines.join(`\n`) : `(no results)`
  }

  /** Data-only rendering of a reply for the persistent memory (model context). */
  static memoryText(reply: IDbChatReply): string {
    switch (reply.kind) {
      case `live`: return reply.reply
      case `live-exhausted`: case `live-noanswer`: return `(no answer)`
      case `mock-echo`: return reply.text ?? ``
      case `mock-error`: return `(error: ${reply.code ?? ``})`
      case `mock-query-empty`: return `(no results)`
      default: return reply.lines.join(`\n`)
    }
  }

  static async chat(db: Db, userId: number, text: string, lang: Lang = `en`, now = new Date()): Promise<IDbChatReply> {
    const memory = db.memory.list(userId)
    // Read env fresh (not load-time cache) — see AppConfig.isMock.
    const cfg = AppConfig.load()
    const mock = AppConfig.isMock()

    const built = mock
      ? await DbChatService.mockReply(db, text, memory)
      : await DbChatService.liveReply(db, text, memory, cfg.openaiApiKey, cfg.openaiModel, cfg.openaiBaseUrl, now, lang)
    const reply: IDbChatReply = {...built, via: mock ? `mock` : `openai`}

    await db.memory.add(userId, {role: `user`, text, at: Date.now()})
    // Memory stores DATA for the model, not the localized sentence — the
    // sentence lives in the page template. The model reads this turn back
    // as context; the user never sees the stored text.
    await db.memory.add(userId, {role: `assistant`, text: DbChatService.memoryText(reply), at: Date.now()})
    return reply
  }

  private static async liveReply(
    db: Db,
    text: string,
    memory: ITurn[],
    apiKey: string,
    model: string,
    baseUrl: string,
    now: Date,
    lang: Lang,
  ): Promise<Omit<IDbChatReply, `via`>> {
    const tables = await db.tables.list()
    const messages: IChatMessage[] = [
      {role: `system`, content: DbChatService.systemPrompt(tables, now, lang)},
      ...memory.slice(-10).map((t): IChatMessage => ({role: t.role, content: t.text})),
      {role: `user`, content: text},
    ]
    const toolsUsed: string[] = []
    for (let round = 0; round < 3; round++) {
      const {message} = await OpenAIClient.chat(apiKey, model, messages, TOOLS, baseUrl)
      const calls = message.tool_calls ?? []
      if (calls.length === 0) {
        const reply = (message.content ?? ``).trim()
        return reply
          ? {kind: `live`, reply, lines: [], toolsUsed}
          : {kind: `live-noanswer`, reply: ``, lines: [], toolsUsed}
      }
      messages.push({role: `assistant`, content: message.content, tool_calls: calls})
      for (const call of calls) {
        toolsUsed.push(call.function.name)
        let args: Record<string, unknown> = {}
        try {
          args = JSON.parse(call.function.arguments) as Record<string, unknown>
        } catch {
          args = {}
        }
        const section = await DbChatService.runTool(db, call.function.name, args)
        messages.push({role: `tool`, content: DbChatService.formatForModel(section), tool_call_id: call.id})
      }
    }
    return {kind: `live-exhausted`, reply: ``, lines: [], toolsUsed}
  }

  /** Deterministic structured replies without OpenAI — for tests and when no key is set. */
  private static async mockReply(db: Db, text: string, memory: ITurn[]): Promise<Omit<IDbChatReply, `via`>> {
    const lower = text.toLowerCase()
    const tables = await db.tables.list()
    const tableNames = tables.map((t) => t.name)
    const mentionedTable = tableNames.find((n) => lower.includes(n))

    // "Which tables are available?" — the original sticky note's example.
    if (/which tables|what tables|tables available|list.*tables|show.*tables/.test(lower)) {
      const section = await DbChatService.runTool(db, `list_tables`, {})
      return {kind: `mock-tables`, reply: ``, lines: section.lines, toolsUsed: [`list_tables`]}
    }

    // "Describe / schema of <table>" / "columns of <table>".
    const describeMatch = lower.match(/(?:describe|schema|columns?)(?: of| for| in)?\s+(customers|products|orders)/)
    if (describeMatch?.[1] !== undefined) {
      const table = describeMatch[1]
      const section = await DbChatService.runTool(db, `describe_table`, {table})
      if (section.code !== undefined) {
        return {kind: `mock-error`, reply: ``, code: section.code, detail: section.detail ?? ``, lines: [], toolsUsed: [`describe_table`]}
      }
      return {kind: `mock-describe`, reply: ``, table, lines: section.lines, toolsUsed: [`describe_table`]}
    }

    // "How many <table> are there?" — count aggregate.
    const countMatch = lower.match(/how many\s+(customers|products|orders)/)
    if (countMatch?.[1] !== undefined) {
      const table = countMatch[1]
      const section = await DbChatService.runTool(db, `run_query`, {table, aggregate: {fn: `count`}})
      return DbChatService.queryReply(table, section, [`run_query`])
    }

    // "Total revenue (by product)?" — sum of orders.total, grouped by product.
    if (/revenue|total sales|total income|total.*orders.*worth/.test(lower)) {
      const byProduct = /by product/.test(lower)
      const section = await DbChatService.runTool(db, `run_query`, {
        table: `orders`,
        aggregate: {fn: `sum`, field: `total`},
        ...(byProduct ? {groupBy: `product_id`} : {}),
      })
      if (section.code === undefined && byProduct) {
        const outcome = await QueryExecutor.run(db, {table: `orders`, aggregate: {fn: `sum`, field: `total`}, groupBy: `product_id`})
        if (outcome.ok && outcome.result.grouped !== undefined) {
          const labeled = await DbChatService.labelGroupedKeys(db, `orders`, `product_id`, outcome.result.grouped)
          const lines = labeled.map((g) => `• ${g.key}: ${DbChatService.formatNumber(g.value)}`)
          return {kind: `mock-query`, reply: ``, table: `orders`, total: outcome.result.total, lines, toolsUsed: [`run_query`]}
        }
      }
      return DbChatService.queryReply(`orders`, section, [`run_query`])
    }

    // "List customers from <city>" / "customers in <city>".
    const cityMatch = lower.match(/customers?\s+(?:from|in|who live in)\s+([a-z ]+)/)
    if (cityMatch?.[1] !== undefined) {
      const city = cityMatch[1].trim().replace(/\s+$/, ``)
      const section = await DbChatService.runTool(db, `run_query`, {
        table: `customers`,
        filters: [{field: `city`, op: `eq`, value: DbChatService.titleCase(city)}],
        limit: 10,
      })
      return DbChatService.queryReply(`customers`, section, [`run_query`])
    }

    // "List / show <table>" — plain listing, 10 rows.
    const listMatch = lower.match(/(?:list|show)(?: me)?(?: all)?\s+(?:the\s+)?(customers|products|orders)/)
    if (listMatch?.[1] !== undefined) {
      const table = listMatch[1]
      const section = await DbChatService.runTool(db, `run_query`, {table, limit: 10})
      return DbChatService.queryReply(table, section, [`run_query`])
    }

    // Stock questions: "out of stock" / "in stock" / "which products are low on stock".
    if (/out of stock|in stock|low on stock|stock/.test(lower)) {
      const outOfStock = /out of stock/.test(lower)
      const section = await DbChatService.runTool(db, `run_query`, {
        table: `products`,
        filters: outOfStock
          ? [{field: `stock`, op: `eq`, value: 0}]
          : [{field: `stock`, op: `gt`, value: 0}],
        limit: 10,
      })
      return DbChatService.queryReply(`products`, section, [`run_query`])
    }

    // A table name on its own ("orders?") — list it.
    if (mentionedTable !== undefined && /^(customers|products|orders)\??$/.test(lower.trim())) {
      const section = await DbChatService.runTool(db, `run_query`, {table: mentionedTable, limit: 10})
      return DbChatService.queryReply(mentionedTable, section, [`run_query`])
    }

    const turns = memory.length + 1
    return {kind: `mock-echo`, reply: ``, text, turns, lines: [], toolsUsed: []}
  }

  /** Shared shape for a run_query mock answer (ok / empty / error). */
  private static queryReply(table: string, section: IToolSection, toolsUsed: string[]): Omit<IDbChatReply, `via`> {
    if (section.code !== undefined) {
      return {kind: `mock-error`, reply: ``, table, code: section.code, detail: section.detail ?? ``, lines: [], toolsUsed}
    }
    if (section.lines.length === 0) {
      return {kind: `mock-query-empty`, reply: ``, table, lines: [], toolsUsed}
    }
    return {kind: `mock-query`, reply: ``, table, total: section.total ?? 0, lines: section.lines, toolsUsed}
  }

  private static titleCase(value: string): string {
    return value
      .split(/\s+/)
      .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
      .join(` `)
  }
}
