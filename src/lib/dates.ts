/**
 * Asia/Jakarta dates and times + a simple date parser for the
 * calendar/email tools, in both languages ("today", "tomorrow", "hari
 * ini", "besok", "lusa", ISO, DD/MM/YYYY, "19 November 2026").
 */
export class Dates {
  static readonly TZ = `Asia/Jakarta`

  static nowJakarta(): Date {
    return new Date()
  }

  /** `2026-11-19` dalam zona Asia/Jakarta. */
  static todayKey(now = new Date()): string {
    return Dates.keyOf(now)
  }

  static keyOf(d: Date): string {
    const parts = new Intl.DateTimeFormat(`en-CA`, {
      timeZone: Dates.TZ,
      year: `numeric`,
      month: `2-digit`,
      day: `2-digit`,
    }).formatToParts(d)
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? `00`
    return `${get(`year`)}-${get(`month`)}-${get(`day`)}`
  }

  static addDays(key: string, days: number): string {
    const [y, m, d] = key.split(`-`).map(Number)
    const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1))
    dt.setUTCDate(dt.getUTCDate() + days)
    return dt.toISOString().slice(0, 10)
  }

  static jakartaLong(now = new Date(), locale = `en-GB`): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone: Dates.TZ,
      weekday: `long`,
      day: `numeric`,
      month: `long`,
      year: `numeric`,
      hour: `2-digit`,
      minute: `2-digit`,
    }).format(now)
  }

  /**
   * Parse a date request in the user's language. Returns a YYYY-MM-DD
   * key, or undefined when unrecognized (the caller falls back to today).
   */
  static parseDate(text: string, now = new Date()): string | undefined {
    const lower = text.toLowerCase()
    const today = Dates.keyOf(now)
    if (/\blusa\b/.test(lower) || /\bday after tomorrow\b/.test(lower)) return Dates.addDays(today, 2)
    if (/\bbesok\b/.test(lower) || /\btomorrow\b/.test(lower)) return Dates.addDays(today, 1)
    if (/\bhari ini\b/.test(lower) || /\bsekarang\b/.test(lower) || /\btoday\b/.test(lower) || /\bnow\b/.test(lower)) return today
    const iso = lower.match(/(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const dmy = lower.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dmy) {
      const dd = (dmy[1] ?? `1`).padStart(2, `0`)
      const mm = (dmy[2] ?? `1`).padStart(2, `0`)
      return `${dmy[3]}-${mm}-${dd}`
    }
    const months: Record<string, string> = {
      januari: `01`, january: `01`, februari: `02`, february: `02`, maret: `03`, march: `03`,
      april: `04`, mei: `05`, may: `05`, juni: `06`, june: `06`,
      juli: `07`, july: `07`, agustus: `08`, august: `08`, september: `09`,
      oktober: `10`, october: `10`, november: `11`, desember: `12`, december: `12`,
    }
    const named = lower.match(/(\d{1,2})\s+(januari|january|februari|february|maret|march|april|mei|may|juni|june|juli|july|agustus|august|september|oktober|october|november|desember|december)(?:\s+(\d{4}))?/)
    if (named) {
      const year = named[3] ?? String(now.getFullYear())
      return `${year}-${months[named[2]!]!}-${(named[1] ?? `1`).padStart(2, `0`)}`
    }
    return undefined
  }

  /** Backwards-compatible alias — same parser, same behavior. */
  static parseIndonesianDate(text: string, now = new Date()): string | undefined {
    return Dates.parseDate(text, now)
  }

  /** Rentang [awal hari, awal hari berikutnya] untuk satu kunci tanggal (UTC, cukup untuk query Calendar). */
  static dayRange(key: string): {timeMin: string; timeMax: string} {
    return {
      timeMin: `${key}T00:00:00Z`,
      timeMax: `${Dates.addDays(key, 1)}T00:00:00Z`,
    }
  }
}
