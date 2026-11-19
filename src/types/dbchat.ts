/** One turn of the conversation (user or assistant), stored in LMDB. */
export interface ITurn {
  role: `user` | `assistant`
  text: string
  at: number
}

/** One column of a demo table. `type` is the value kind stored in rows. */
export interface ITableColumn {
  name: string
  type: `integer` | `number` | `string` | `date`
  /** Human note shown by /schema, e.g. "references customers.id". */
  note?: string
}

/** One table of the demo dataset: its columns and its rows (plain objects). */
export interface ITable {
  name: string
  description: string
  columns: ITableColumn[]
  rows: Record<string, unknown>[]
}

/** A filter inside a structured query. */
export interface IQueryFilter {
  field: string
  op: `eq` | `ne` | `gt` | `gte` | `lt` | `lte` | `contains`
  value: string | number
}

/**
 * A structured read-only query. The agent emits this object — never a raw
 * SQL string. Anything outside this shape (unknown table/field, unknown
 * operator, write intent) is rejected by the executor before it runs.
 */
export interface IStructuredQuery {
  table: string
  filters?: IQueryFilter[]
  sortBy?: string
  sortDir?: `asc` | `desc`
  limit?: number
  aggregate?: {
    fn: `count` | `sum` | `avg` | `min` | `max`
    field?: string
  }
  groupBy?: string
}

/** One grouped aggregate row: the group key and the aggregated value. */
export interface IGroupedRow {
  key: string
  value: number
}

/** The executor's answer: columns, matching rows, and optional aggregates. */
export interface IQueryResult {
  table: string
  columns: string[]
  /** Rows as plain objects, already filtered / sorted / limited. */
  rows: Record<string, unknown>[]
  /** Rows matched before the limit was applied. */
  total: number
  aggregate?: {fn: string; field?: string; value: number}
  grouped?: IGroupedRow[]
}
