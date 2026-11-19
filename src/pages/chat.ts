import {PageBase} from "~/base/page"
import {DbChatService, type DbChatReplyKind} from "~/lib/dbchat"

/**
 * ChatPage — the heart of the bot: any free text goes to DB Chat.
 *
 * - handleFreeText: free text (not a command) -> DbChatService.chat.
 *
 * All words live in `static template` (EN default + `lang="id"` variant):
 * one flat `<g-switch value="kind">` with a case per reply kind; result
 * rows render through `<g-map>`. The page only computes data (kind +
 * template variables). Strict rule (Damar 2026-11-19 ~14:43 WIB): no
 * string dictionary.
 */
export class ChatPage extends PageBase {
  static data = this.buildData()

  async handleFreeText() {
    const text = this.msg?.text ?? ``
    if (!text || text.startsWith(`/`)) return
    await this.gchat.process(text)
  }

  helper = {
    typing: async () => {
      try {
        const chatId = this.chat?.id ?? this.from?.id
        if (chatId !== undefined) await this.api.sendChatAction(chatId, `typing`)
      } catch {
        // The typing indicator is cosmetic — the answer still goes through without it.
      }
    },
    /** Render one DB Chat reply through the template switch. */
    answer: async (data: {
      kind: DbChatReplyKind | `error`
      reply?: string
      text?: string
      turns?: number
      table?: string
      total?: number
      code?: string
      detail?: string
      lines?: string[]
    }) => {
      await this.renderText({
        mode: `reply`,
        data: {
          kind: data.kind,
          reply: data.reply ?? ``,
          text: data.text ?? ``,
          turns: data.turns ?? 0,
          table: data.table ?? ``,
          total: data.total ?? 0,
          code: data.code ?? ``,
          detail: data.detail ?? ``,
          lines: data.lines ?? [],
        },
      })
    },
  }

  gchat = {
    show: async () => {},
    process: async (text: string) => {
      const userId = this.from?.id
      if (userId === undefined) return
      await this.helper.typing()
      try {
        const result = await DbChatService.chat(this.db, userId, text, this.lang())
        await this.helper.answer({kind: result.kind, ...ChatPage.toTemplateData(result)})
      } catch (err) {
        await this.helper.answer({kind: `error`})
        throw err
      }
    },
  }

  /** Map a service reply onto the template's data fields (data only, no words). */
  static toTemplateData(result: Awaited<ReturnType<typeof DbChatService.chat>>) {
    return {
      reply: result.reply,
      text: result.text ?? ``,
      turns: result.turns ?? 0,
      table: result.table ?? ``,
      total: result.total ?? 0,
      code: result.code ?? ``,
      detail: result.detail ?? ``,
      lines: result.lines,
    }
  }

  static template = `
    <g-base>
      <g-message>
        <g-switch value="kind">
          <g-case is="live">{{reply}}</g-case>
          <g-case is="live-exhausted">I checked the data, but I ran out of steps to summarize it. Please ask again, more specifically.</g-case>
          <g-case is="live-noanswer">Sorry, I cannot answer that right now.</g-case>
          <g-case is="mock-tables"><b>🗄️ Tables in the database</b>

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-describe"><b>📋 Schema of {{table}}</b>

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-query"><b>📊 Result — {{table}}</b> ({{total}} rows)

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-query-empty">No rows match that question in {{table}}. Try a different filter — or check the columns with /schema {{table}}.</g-case>
          <g-case is="mock-error">I could not run that query ({{code}}<g-ifelse>detail ? ' — ' + detail : ''</g-ifelse>). Check the table and column names with /tables and /schema, then ask again.</g-case>
          <g-case is="mock-echo">Noted. You said: "{{text}}". We have exchanged {{turns}} messages — ask me anything about the database, for example: "Which tables are available?"</g-case>
          <g-default>Sorry, something went wrong while I was processing your message. Please try again in a moment.</g-default>
        </g-switch>
      </g-message>
      <g-message lang="id">
        <g-switch value="kind">
          <g-case is="live">{{reply}}</g-case>
          <g-case is="live-exhausted">Sudah kuperiksa datanya, tapi aku kehabisan langkah untuk merangkumnya. Coba tanya lagi dengan lebih spesifik ya.</g-case>
          <g-case is="live-noanswer">Maaf, aku tidak bisa menjawab itu sekarang.</g-case>
          <g-case is="mock-tables"><b>🗄️ Tabel di database</b>

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-describe"><b>📋 Skema {{table}}</b>

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-query"><b>📊 Hasil — {{table}}</b> ({{total}} baris)

<g-map src="lines" join="\\n">{{e}}</g-map></g-case>
          <g-case is="mock-query-empty">Tidak ada baris yang cocok dengan pertanyaan itu di {{table}}. Coba filter lain — atau cek kolomnya dengan /schema {{table}}.</g-case>
          <g-case is="mock-error">Aku tidak bisa menjalankan query itu ({{code}}<g-ifelse>detail ? ' — ' + detail : ''</g-ifelse>). Cek nama tabel dan kolom dengan /tables dan /schema, lalu tanya lagi.</g-case>
          <g-case is="mock-echo">Baik, dicatat. Kamu bilang: "{{text}}". Kita sudah ngobrol {{turns}} pesan — tanyakan apa pun tentang database, contoh: "Tabel apa saja yang tersedia?"</g-case>
          <g-default>Maaf, ada yang salah saat aku memproses pesanmu. Coba lagi sebentar lagi ya.</g-default>
        </g-switch>
      </g-message>
    </g-base>
  `
}
