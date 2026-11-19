import {PageBase} from "~/base/page"
import {StartPage} from "./start"

export class HelpPage extends PageBase {
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
      await this.renderText({mode: `auto`, keyboard: this.inlineKeyboardT([StartPage])})
    },
    process: () => {},
  }

  static template = `
    <g-base>
      <g-description>Full help and command list</g-description>
      <g-description lang="id">Bantuan lengkap dan daftar perintah</g-description>
      ${this.kbk.back()}
      <g-message>
        <b>🆘 Help — DB Chat</b>

        <b>Chat directly</b>
        Just send a question in plain English — no SQL needed. I turn it
        into a read-only query, run it against the database, and answer.
        I remember the last 10 messages of our chat, so follow-up
        questions keep their context even if the bot restarts.

        <b>Example questions</b>
        • Which tables are available?
        • How many orders are there?
        • Total revenue by product?
        • List customers from Jakarta
        • Which products are out of stock?

        <b>Commands</b>
        All commands are in English. Replies are bilingual — English by
        default, Indonesian when you pick it with /language.
        /start — introduction &amp; main menu
        /tables — list all tables with row counts
        /schema &lt;table&gt; — columns of a table (example: /schema orders)
        /language — switch language (English / Indonesia)
        /forget — erase my memory of this chat
        /help — this page

        <b>What to set up so every feature works</b>
        • OPENAI_API_KEY — for AI answers (GPT-4o-mini).
          Without it I still run, but answers come from simple mode.
        • The demo dataset (customers, products, orders) is seeded
          automatically on first run. To use your own data, replace the
          seed tables and clear the database directory (see README).
      </g-message>
      <g-message lang="id">
        <b>🆘 Bantuan — DB Chat</b>

        <b>Ngobrol langsung</b>
        Kirim saja pertanyaan pakai bahasa sehari-hari — tanpa SQL. Aku
        mengubahnya menjadi query read-only, menjalankannya ke database,
        lalu menjawab. Aku mengingat 10 pesan terakhir obrolan kita, jadi
        pertanyaan lanjutan tetap nyambung walau bot restart.

        <b>Contoh pertanyaan</b>
        • Tabel apa saja yang tersedia?
        • Berapa banyak order yang ada?
        • Total pendapatan per produk?
        • Daftar pelanggan dari Jakarta
        • Produk apa saja yang habis stoknya?

        <b>Perintah</b>
        Semua perintah memakai bahasa Inggris. Balasannya bilingual —
        bahasa Inggris sebagai default, bahasa Indonesia kalau kamu pilih
        lewat /language.
        /start — perkenalan &amp; menu utama
        /tables — daftar semua tabel beserta jumlah barisnya
        /schema &lt;tabel&gt; — kolom sebuah tabel (contoh: /schema orders)
        /language — ganti bahasa (English / Indonesia)
        /forget — hapus ingatanku tentang obrolan ini
        /help — halaman ini

        <b>Yang perlu disiapkan supaya semua fitur jalan</b>
        • OPENAI_API_KEY — untuk jawaban AI (GPT-4o-mini).
          Tanpa ini aku tetap jalan, tapi jawabannya dari mode sederhana.
        • Dataset demo (customers, products, orders) terisi otomatis saat
          pertama jalan. Untuk memakai data sendiri, ganti tabel seed-nya
          lalu hapus direktori database (lihat README).
      </g-message>
    </g-base>
  `
}
