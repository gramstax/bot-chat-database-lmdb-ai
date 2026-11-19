import type {ValueOf} from "@gramstax/lmdb"
import {LmdbSchema, t} from "@gramstax/lmdb"

export type IVMemory = ValueOf<typeof MemorySchema>

/**
 * Conversation memory: one row per userId holding the last
 * 10 turns (user + assistant) as JSON. Persistent in LMDB, so context
 * survives a process restart.
 */
export class MemorySchema extends LmdbSchema {
  static db = `memory`
  static key = t.number()
  static value = {
    turnsJson: t.string(),
    updatedAt: t.date().$defaultFn(() => new Date()),
  }
}
