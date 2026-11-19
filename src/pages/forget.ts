import {PageBase} from "~/base/page"

/**
 * /forget — clear this user's conversation memory (window buffer) from LMDB.
 *
 * The confirmation sentence lives in `static template` (EN default +
 * `lang="id"` variant). Strict rule (Damar 2026-11-19 ~14:43 WIB):
 * no string dictionary.
 */
export class ForgetPage extends PageBase {
  static data = this.buildData()

  async handleCommandText() {
    await this.gdefault.show()
  }

  helper = {}

  gdefault = {
    show: async () => {
      const userId = this.from?.id
      if (userId === undefined) return
      await this.db.memory.clear(userId)
      await this.renderText({data: {}})
    },
    process: () => {},
  }

  static template = `
    <g-base>
      <g-description>Erase my memory of this chat</g-description>
      <g-description lang="id">Hapus ingatanku tentang obrolan ini</g-description>
      <g-message>Forgotten. Our chat starts from zero again — tell me anything from the beginning, and I will remember it again.</g-message>
      <g-message lang="id">Sudah kulupakan. Obrolan kita mulai dari nol lagi — ceritakan apa pun dari awal, nanti kuingat lagi.</g-message>
    </g-base>
  `
}
