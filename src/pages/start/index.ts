import {PageBase} from "~/base/page"
import {HelpPage} from "../help"
import {LanguagePage} from "../language"
import {SchemaPage} from "../schema"
import {TablesPage} from "../tables"

export class StartPage extends PageBase {
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
      await this.clearSession()
      await this.renderText({
        mode: `auto`,
        keyboard: this.inlineKeyboardT([TablesPage, SchemaPage, LanguagePage, HelpPage], `2`),
        data: {userName: this.from?.username ?? this.from?.first_name ?? `you`},
      })
    },
    process: () => {},
  }

  static template = `
    <g-base>
      <g-description>Introduction and main menu</g-description>
      <g-description lang="id">Perkenalan dan menu utama</g-description>
      ${this.kbk.mainMenu()}
      <g-message>
        <b>👋 Hello {{userName}}, I'm DB Chat!</b>

        Ask me anything about your database — in English or Indonesian,
        no SQL needed. I ask GPT-4o-mini to turn your question into a
        query, run it read-only against the database, and answer you.

        <b>Try asking:</b>
        • Which tables are available?
        • How many orders are there?
        • Total revenue by product?
        • List customers from Jakarta

        <b>Commands:</b>
        /tables — list all tables
        /schema &lt;table&gt; — columns of a table (example: /schema orders)
        /language — switch language (English / Indonesia)
        /forget — erase my memory of this chat
        /help — full help
      </g-message>
      <g-message lang="id">
        <b>👋 Halo {{userName}}, aku DB Chat!</b>

        Tanyakan apa pun tentang database kamu — pakai bahasa sehari-hari,
        tanpa SQL. Aku minta GPT-4o-mini mengubah pertanyaanmu menjadi
        query, menjalankannya secara read-only ke database, lalu menjawabmu.

        <b>Coba tanyakan:</b>
        • Tabel apa saja yang tersedia?
        • Berapa banyak order yang ada?
        • Total pendapatan per produk?
        • Daftar pelanggan dari Jakarta

        <b>Perintah:</b>
        /tables — daftar semua tabel
        /schema &lt;tabel&gt; — kolom sebuah tabel (contoh: /schema orders)
        /language — ganti bahasa (English / Indonesia)
        /forget — hapus ingatanku tentang obrolan ini
        /help — bantuan lengkap
      </g-message>
    </g-base>
  `
}
