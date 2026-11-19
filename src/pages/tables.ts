import {PageBase} from "~/base/page"

/**
 * /tables — list every table in the database with its row count.
 *
 * The list comes from the LMDB schema registry itself (TableRepository),
 * so what you see is exactly what the agent can query — never a hardcoded
 * list. All words live in `static template` (EN default + `lang="id"`).
 */
export class TablesPage extends PageBase {
  static data = this.buildData()

  async handleCallbackQueryData() {
    await this.gdefault.show()
  }

  async handleCommandText() {
    await this.gdefault.show()
  }

  helper = {}

  gdefault = {
    show: async () => {
      const tables = await this.db.tables.list()
      await this.renderText({
        data: {
          state: tables.length === 0 ? `empty` : `list`,
          tables: tables.map((t) => ({name: t.name, count: t.rows.length, description: t.description})),
        },
      })
    },
    process: () => {},
  }

  static template = `
    <g-base>
      <g-description>List all tables with row counts</g-description>
      <g-description lang="id">Daftar semua tabel beserta jumlah barisnya</g-description>
      <g-message>
        <g-switch value="state">
          <g-case is="list"><b>🗄️ Tables in the database</b>

<g-map src="tables" join="\\n">• {{e.name}} — {{e.count}} rows — {{e.description}}</g-map>

Ask me anything about them — for example: "How many orders are there?"</g-case>
          <g-case is="empty">The database has no tables yet. Ask the bot owner to seed the demo dataset.</g-case>
        </g-switch>
      </g-message>
      <g-message lang="id">
        <g-switch value="state">
          <g-case is="list"><b>🗄️ Tabel di database</b>

<g-map src="tables" join="\\n">• {{e.name}} — {{e.count}} baris — {{e.description}}</g-map>

Tanyakan apa pun tentang tabel-tabel itu — contoh: "Ada berapa order?"</g-case>
          <g-case is="empty">Database belum punya tabel. Minta pemilik bot untuk mengisi dataset demo.</g-case>
        </g-switch>
      </g-message>
    </g-base>
  `
}
