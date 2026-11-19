import type {LmdbEnvSub} from "@gramstax/lmdb"
import type {ITurn} from "~/types/dbchat"
import type {IVMemory, MemorySchema} from "../schema/memory"

/** Window buffer: max 10 turn terakhir per user (5 pasang tanya-jawab). */
export const MEMORY_MAX_TURNS = 10

export class MemoryRepository {
  constructor(private readonly _sub: LmdbEnvSub<typeof MemorySchema>) {}

  list(userId: number): ITurn[] {
    const row = this._sub.get(userId)
    if (!row) return []
    try {
      const parsed = JSON.parse(row.turnsJson) as ITurn[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  /** Tambah satu turn, potong ke window terakhir. Read-then-write dalam transaksi. */
  async add(userId: number, turn: ITurn): Promise<ITurn[]> {
    return this._sub.owner.transaction(() => {
      const turns = this.list(userId)
      turns.push(turn)
      const kept = turns.slice(-MEMORY_MAX_TURNS)
      this.saveSync(userId, kept)
      return kept
    })
  }

  async clear(userId: number): Promise<void> {
    await this._sub.owner.transaction(() => {
      this.saveSync(userId, [])
    })
  }

  private saveSync(userId: number, turns: ITurn[]): void {
    const row = {turnsJson: JSON.stringify(turns), updatedAt: new Date()} as IVMemory
    this._sub.putSync(userId, row)
  }
}
