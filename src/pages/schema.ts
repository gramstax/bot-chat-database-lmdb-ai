import {PageBase} from "~/base/page"

/**
 * /schema <table> — show the columns of one table.
 *
 * Columns come from the LMDB schema registry (TableRepository), so the
 * answer always matches what the agent can query. All words live in
 * `static template` (EN default + `lang="id"`); the helper only computes
 * data (state + preformatted column lines).
 */
export class SchemaPage extends PageBase {
  static data = this.buildData()

  async handleCallbackQueryData() {
    await this.gdefault.show()
  }

  async handleCommandText() {
    await this.gdefault.show()
  }

  async handleCommandArgsText() {
    await this.gdefault.show(this.msgTextCommandArgs.join(` `))
  }

  helper = {}

  gdefault = {
    show: async (arg?: string) => {
      const name = (arg ?? ``).trim().toLowerCase()
      if (!name) {
        const tables = await this.db.tables.list()
        await this.renderText({
          data: {state: `prompt`, table: ``, count: 0, lines: tables.map((t) => `• ${t.name}`)},
        })
        return
      }
      const table = await this.db.tables.get(name)
      if (!table) {
        await this.renderText({data: {state: `unknown`, table: name, count: 0, lines: []}})
        return
      }
      await this.renderText({
        data: {
          state: `ok`,
          table: table.name,
          count: table.rows.length,
          lines: table.columns.map((c) => `• ${c.name} (${c.type})${c.note ? ` — ${c.note}` : ``}`),
        },
      })
    },
    process: () => {},
  }

  static template = `
    <g-base>
      <g-description>Show the columns of a table</g-description>
      <g-description lang="id">Tampilkan kolom sebuah tabel</g-description>
      <g-message>
        <g-switch value="state">
          <g-case is="ok"><b>📋 Schema of {{table}}</b> — {{count}} rows

<g-map src="lines" join="\\n">{{e}}</g-map>

Ask me anything about this table — for example: "How many {{table}} are there?"</g-case>
          <g-case is="prompt">Which table? Send /schema followed by a table name, for example /schema orders.

Available tables:
<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="unknown">I don't know a table called "{{table}}". Check the name with /tables and try again.</g-case>
        </g-switch>
      </g-message>
      <g-message lang="id">
        <g-switch value="state">
          <g-case is="ok"><b>📋 Skema {{table}}</b> — {{count}} baris

<g-map src="lines" join="\\n">{{e}}</g-map>

Tanyakan apa pun tentang tabel ini — contoh: "Ada berapa {{table}}?"</g-case>
          <g-case is="prompt">Tabel yang mana? Kirim /schema diikuti nama tabel, contoh /schema orders.

Tabel yang tersedia:
<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="unknown">Aku tidak kenal tabel bernama "{{table}}". Cek namanya dengan /tables lalu coba lagi.</g-case>
        </g-switch>
      </g-message>
    </g-base>
  `
}
