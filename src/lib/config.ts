/** Runtime config for DB Chat — all secrets come from env, never hardcoded. */
export interface AppConfigData {
  openaiApiKey: string
  mockAi: boolean
  allowedIds: Set<number>
  dbPath: string
}

export class AppConfig {
  private static current: AppConfigData = AppConfig.load()

  static load(env: NodeJS.ProcessEnv = process.env): AppConfigData {
    return {
      openaiApiKey: env.OPENAI_API_KEY ?? ``,
      mockAi: env.DBCHAT_MOCK_AI === `1` || env.DBCHAT_MOCK_AI === `true`,
      allowedIds: AppConfig.parseIds(env.DBCHAT_ALLOWED_IDS ?? ``),
      dbPath: env.DB_PATH ?? `./data`,
    }
  }

  static get(): AppConfigData {
    return AppConfig.current
  }

  static set(next: AppConfigData): void {
    AppConfig.current = next
  }

  /** Telegram ids that may use the bot; empty = everyone allowed (dev mode). */
  static allowedIds(env: NodeJS.ProcessEnv = process.env): Set<number> {
    // When AppConfig.load already ran with the current env, use the cache;
    // when env changed after load (tests), read it again from env.
    const fromEnv = AppConfig.parseIds(env.DBCHAT_ALLOWED_IDS ?? ``)
    if (fromEnv.size > 0) return fromEnv
    return AppConfig.current.allowedIds
  }

  static parseIds(raw: string): Set<number> {
    const out = new Set<number>()
    for (const part of raw.split(`,`)) {
      const n = Number(part.trim())
      if (Number.isFinite(n) && n > 0) out.add(Math.floor(n))
    }
    return out
  }

  /**
   * Mock is active when DBCHAT_MOCK_AI=1 OR when no OPENAI_API_KEY is set.
   * Reads env DIRECTLY (not the load-time cache): e2e setup sets env after
   * the module was imported, so a cache would go stale.
   */
  static isMock(env: NodeJS.ProcessEnv = process.env): boolean {
    if (env.DBCHAT_MOCK_AI === `1` || env.DBCHAT_MOCK_AI === `true`) return true
    return (env.OPENAI_API_KEY ?? ``).trim() === ``
  }
}
