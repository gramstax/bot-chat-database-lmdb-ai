import type {LmdbEnvSub} from "@gramstax/lmdb"
import {demoTables} from "~/lib/seed"
import type {ITable, ITableColumn} from "~/types/dbchat"
import type {IVTable, TableSchema} from "../schema/table"

export class TableRepository {
  constructor(private readonly _sub: LmdbEnvSub<typeof TableSchema>) {}

  private static parse(row: IVTable, name: string): ITable {
    let columns: ITableColumn[] = []
    let rows: Record<string, unknown>[] = []
    try {
      const parsed = JSON.parse(row.columnsJson) as ITableColumn[]
      if (Array.isArray(parsed)) columns = parsed
    } catch {
      columns = []
    }
    try {
      const parsed = JSON.parse(row.rowsJson) as Record<string, unknown>[]
      if (Array.isArray(parsed)) rows = parsed
    } catch {
      rows = []
    }
    return {name, description: row.description, columns, rows}
  }

  /** All tables, sorted by name. Async: `values()` materializes the range. */
  async list(): Promise<ITable[]> {
    const entries = await this._sub.entries()
    return entries.map(([name, row]) => TableRepository.parse(row, name)).sort((a, b) => a.name.localeCompare(b.name))
  }

  async get(name: string): Promise<ITable | undefined> {
    const row = this._sub.get(name)
    if (!row) return undefined
    return TableRepository.parse(row, name)
  }

  async count(name: string): Promise<number> {
    const table = await this.get(name)
    return table?.rows.length ?? 0
  }

  /**
   * Seed the demo dataset on first run. Idempotent: tables that already
   * exist are left alone, so a customized dataset is never overwritten.
   * Returns true when at least one table was seeded.
   */
  async ensureSeeded(): Promise<boolean> {
    let seeded = false
    await this._sub.owner.transaction(() => {
      for (const table of demoTables()) {
        if (this._sub.get(table.name)) continue
        this._sub.putSync(table.name, {
          description: table.description,
          columnsJson: JSON.stringify(table.columns),
          rowsJson: JSON.stringify(table.rows),
          updatedAt: new Date(),
        } as IVTable)
        seeded = true
      }
    })
    return seeded
  }
}
