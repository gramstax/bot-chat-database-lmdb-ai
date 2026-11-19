import type {Db} from "~/db"
import type {IGroupedRow, IQueryResult, IStructuredQuery} from "~/types/dbchat"

/** Hard cap: a single answer never dumps the whole database at the user. */
export const QUERY_MAX_LIMIT = 50

export type QueryErrorCode = `unknown-table` | `unknown-field` | `bad-operator` | `bad-aggregate` | `bad-group` | `bad-limit`

export type QueryOutcome = {ok: true; result: IQueryResult} | {ok: false; code: QueryErrorCode; detail: string}

/**
 * The structured-query executor — the LMDB replacement for a SQL engine.
 *
 * The agent NEVER writes SQL: it emits an `IStructuredQuery` object and
 * this executor validates it (known table, known fields, whitelisted
 * operators, whitelisted aggregates) before running it. There is no code
 * path that executes a raw string as a query, so a read-only guarantee is
 * structural, not a promise in a prompt.
 */
export class QueryExecutor {
  static async run(db: Db, query: IStructuredQuery): Promise<QueryOutcome> {
    const table = await db.tables.get(query.table)
    if (!table) {
      return {ok: false, code: `unknown-table`, detail: query.table}
    }
    const fields = new Set(table.columns.map((c) => c.name))
    const columns = table.columns.map((c) => c.name)

    const filters = query.filters ?? []
    for (const f of filters) {
      if (!fields.has(f.field)) return {ok: false, code: `unknown-field`, detail: f.field}
      if (![`eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`].includes(f.op)) {
        return {ok: false, code: `bad-operator`, detail: f.op}
      }
    }
    if (query.sortBy !== undefined && !fields.has(query.sortBy)) {
      return {ok: false, code: `unknown-field`, detail: query.sortBy}
    }
    const limit = query.limit ?? 10
    if (!Number.isFinite(limit) || limit < 1 || limit > QUERY_MAX_LIMIT) {
      return {ok: false, code: `bad-limit`, detail: String(query.limit)}
    }
    if (query.aggregate !== undefined) {
      const {fn, field} = query.aggregate
      if (![`count`, `sum`, `avg`, `min`, `max`].includes(fn)) {
        return {ok: false, code: `bad-aggregate`, detail: fn}
      }
      if (fn !== `count` && (field === undefined || !fields.has(field))) {
        return {ok: false, code: `unknown-field`, detail: field ?? ``}
      }
    }
    if (query.groupBy !== undefined && !fields.has(query.groupBy)) {
      return {ok: false, code: `bad-group`, detail: query.groupBy}
    }

    let rows = table.rows.filter((row) => filters.every((f) => QueryExecutor.matches(row[f.field], f.op, f.value)))
    const total = rows.length

    if (query.sortBy !== undefined) {
      const key = query.sortBy
      const dir = query.sortDir === `desc` ? -1 : 1
      rows = [...rows].sort((a, b) => QueryExecutor.compare(a[key], b[key]) * dir)
    }

    const result: IQueryResult = {table: table.name, columns, rows: rows.slice(0, limit), total}

    if (query.aggregate !== undefined) {
      const {fn, field} = query.aggregate
      if (query.groupBy !== undefined) {
        const groups = new Map<string, number[]>()
        for (const row of rows) {
          const key = String(row[query.groupBy] ?? ``)
          const bucket = groups.get(key) ?? []
          if (fn === `count`) bucket.push(1)
          else if (typeof row[field!] === `number`) bucket.push(row[field!] as number)
          groups.set(key, bucket)
        }
        const grouped: IGroupedRow[] = [...groups.entries()]
          .map(([key, values]) => ({key, value: QueryExecutor.reduce(fn, values)}))
          .sort((a, b) => b.value - a.value)
        result.grouped = grouped
      } else if (fn === `count`) {
        result.aggregate = {fn, field, value: rows.length}
      } else {
        const values = rows.map((r) => r[field!]).filter((v): v is number => typeof v === `number`)
        result.aggregate = {fn, field, value: QueryExecutor.reduce(fn, values)}
      }
    }
    return {ok: true, result}
  }

  private static matches(value: unknown, op: string, wanted: string | number): boolean {
    switch (op) {
      case `eq`: return QueryExecutor.equals(value, wanted)
      case `ne`: return !QueryExecutor.equals(value, wanted)
      case `gt`: return QueryExecutor.compare(value, wanted) > 0
      case `gte`: return QueryExecutor.compare(value, wanted) >= 0
      case `lt`: return QueryExecutor.compare(value, wanted) < 0
      case `lte`: return QueryExecutor.compare(value, wanted) <= 0
      case `contains`: return typeof value === `string` && typeof wanted === `string` && value.toLowerCase().includes(wanted.toLowerCase())
      default: return false
    }
  }

  private static equals(value: unknown, wanted: string | number): boolean {
    if (typeof value === `number` && typeof wanted === `string`) {
      const n = Number(wanted)
      return Number.isFinite(n) ? value === n : false
    }
    if (typeof value === `string` && typeof wanted === `number`) return value.toLowerCase() === String(wanted).toLowerCase()
    if (typeof value === `string` && typeof wanted === `string`) return value.toLowerCase() === wanted.toLowerCase()
    return value === wanted
  }

  /** Numbers compare numerically; dates (YYYY-MM-DD) and strings lexicographically. */
  private static compare(a: unknown, b: unknown): number {
    if (typeof a === `number` && typeof b === `number`) return a - b
    if (typeof a === `number`) return a - Number(b)
    if (typeof b === `number`) return Number(a) - b
    return String(a ?? ``).localeCompare(String(b ?? ``))
  }

  private static reduce(fn: string, values: number[]): number {
    if (values.length === 0) return 0
    switch (fn) {
      case `count`: return values.length
      case `sum`: return values.reduce((s, v) => s + v, 0)
      case `avg`: return values.reduce((s, v) => s + v, 0) / values.length
      case `min`: return Math.min(...values)
      case `max`: return Math.max(...values)
      default: return 0
    }
  }
}
