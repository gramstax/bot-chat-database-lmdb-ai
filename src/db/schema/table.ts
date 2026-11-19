import type {ValueOf} from "@gramstax/lmdb"
import {LmdbSchema, t} from "@gramstax/lmdb"

export type IVTable = ValueOf<typeof TableSchema>

/**
 * One row per table: the table name is the key, columns and rows are JSON.
 * The demo dataset is small (3 tables, ~40 rows), so one row per table is
 * the simplest shape that still lets list/describe/query read real rows —
 * the same JSON-in-one-row pattern the sister bot uses for its lists.
 * New fields MUST be appended at the END — LMDB encoding is positional.
 */
export class TableSchema extends LmdbSchema {
  static db = `tables`
  static key = t.string()

  static value = {
    description: t.string(),
    columnsJson: t.string(),
    rowsJson: t.string(),
    updatedAt: t.date().$defaultFn(() => new Date()),
  }
}
