import {describe, expect, it} from "bun:test"
import {Dates} from "../src/lib/dates"

describe(`Dates`, () => {
  it(`parses besok/lusa/hari ini relative to the given day`, () => {
    const now = new Date(`2026-11-19T08:00:00+07:00`)
    expect(Dates.parseIndonesianDate(`jadwal besok`, now)).toBe(`2026-11-20`)
    expect(Dates.parseIndonesianDate(`acara lusa`, now)).toBe(`2026-11-21`)
    expect(Dates.parseIndonesianDate(`hari ini`, now)).toBe(`2026-11-19`)
  })

  it(`parses ISO and DD/MM/YYYY and named months`, () => {
    const now = new Date(`2026-11-19T08:00:00+07:00`)
    expect(Dates.parseIndonesianDate(`2026-12-25`, now)).toBe(`2026-12-25`)
    expect(Dates.parseIndonesianDate(`25/12/2026`, now)).toBe(`2026-12-25`)
    expect(Dates.parseIndonesianDate(`25 Desember 2026`, now)).toBe(`2026-12-25`)
  })

  it(`returns undefined for unrecognized dates`, () => {
    expect(Dates.parseIndonesianDate(`kapan-kapan saja`, new Date())).toBeUndefined()
  })

  it(`dayRange spans exactly one day`, () => {
    const range = Dates.dayRange(`2026-11-19`)
    expect(range.timeMin).toBe(`2026-11-19T00:00:00Z`)
    expect(range.timeMax).toBe(`2026-11-20T00:00:00Z`)
  })

  it(`system prompt date is in Indonesian, Asia/Jakarta`, () => {
    const long = Dates.jakartaLong(new Date(`2026-11-19T08:00:00+07:00`))
    expect(long).toContain(`19 November 2026`)
  })
})
