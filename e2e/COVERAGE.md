# Coverage ledger — bot-chat-database-lmdb-ai

Skill gramstax-best-practices 6.1.0, `e2e-coverage.md`: one row per
handler and per interactive state. A row without a test file name is a
FAILURE, not a TODO. `Asserts` records the concrete method + payload.
Checked by machine by `scripts/check-e2e-mirror.ts` (layer 1: mirror +
orphan) and `scripts/check-e2e-handlers.ts` (layer 2: every `handle*`
in `src/pages` has a row, every row names an existing test file, every
test file is referenced by at least one row).

All templates are bilingual: default block in English + `lang="id"`
variant (the framework's built-in multi-lang object for static template
content). There is no string dictionary in code: every user-facing
message lives in `static template` (`<g-message>` / `<g-switch>` /
`<g-map>` / `<g-ifelse>`, EN default + `lang="id"`); helpers/pages only
compute data (state, list rows, error codes) and pass it as template
variables. The only documented exceptions are the LLM system prompt and
the model-facing tokens in `src/lib/dbchat.ts` (not user-facing).
Multi-language keyboards are defined ONCE in `src/blocks/g-keyboard.ts`
(`KeyboardGBlock.label` + `_build`); templates never write
`<g-keyboard>` twice. Command descriptions (`<g-description>`, EN + ID)
live in the default `<g-base>` of each command page and are synced to
BotFather at bot start (`executeSyncBlocksDescription`, framework
default — 6 unique commands per language; commands are English-only,
one intent per page, so nothing can duplicate). StatusPage has no
`handle*` of its own — it is rendered via hooks (see the hook rows).

| Page | Handler / state | Trigger | Test | Asserts |
| --- | --- | --- | --- | --- |
| start | handleCommandText | `/start` (user id) | e2e/start/index.test.ts | sendMessage + gmsg(start, default, {userName}, id) + gkb menu ID |
| start | handleCommandText (EN) | `/start` (user en) | e2e/start/index.test.ts | sendMessage + gmsg(start, default, {userName}, en) + gkb menu EN |
| start | handleCallbackQueryData | tombol Start (callback) | e2e/start/index.test.ts | editMessageText + gmsg(start, default, {userName}, id) + gkb |
| start | tombol Tables dari /start | callback `tables` | e2e/start/index.test.ts | editMessageText + "customers — 12 rows" |
| help | handleCommandText | `/help` (user id) | e2e/help.test.ts | sendMessage + gmsg(help, default, {}, id) + gkb |
| help | handleCommandText (EN) | `/help` (user en) | e2e/help.test.ts | sendMessage + gmsg(help, default, {}, en) + gkb |
| help | handleCallbackQueryData | tombol Help dari /start | e2e/help.test.ts | editMessageText + gmsg(help, default, {}, id) + gkb |
| tables | handleCommandText (id) | `/tables` | e2e/tables.test.ts | sendMessage + gmsg(tables, default, {state list, 3 tables}, id) |
| tables | handleCommandText (EN) | `/tables` | e2e/tables.test.ts | sendMessage + gmsg(tables, default, {state list, 3 tables}, en) |
| tables | handleCallbackQueryData | tombol Tables dari /start | e2e/tables.test.ts | editMessageText + "customers — 12 rows" |
| schema | handleCommandText (orders, id) | `/schema orders` | e2e/schema.test.ts | sendMessage + gmsg(schema, default, {state ok, 16, columns}, id) |
| schema | handleCommandText (products, EN) | `/schema products` | e2e/schema.test.ts | sendMessage + gmsg(schema, default, {state ok, 10, columns}, en) |
| schema | handleCommandText (prompt) | `/schema` tanpa argumen | e2e/schema.test.ts | gmsg(schema, default, {state prompt, lines 3 tabel}, id) |
| schema | handleCommandArgsText (unknown) | `/schema invoices` | e2e/schema.test.ts | gmsg(schema, default, {state unknown, table invoices}, id) |
| schema | handleCallbackQueryData | tombol Schema dari /start | e2e/start/index.test.ts | callback `schema` reaches the schema page (via menu) |
| chat | handleFreeText (tables, id) | "Which tables are available?" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-tables, 3 lines}, id) + memory 2 baris |
| chat | handleFreeText (count, EN) | "How many orders are there?" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-query, count 16}, en) |
| chat | handleFreeText (revenue) | "Total revenue by product?" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-query, Running Shoes 3,897,000 first}, id) |
| chat | handleFreeText (Jakarta) | "List customers from Jakarta" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-query, total 4}, id) |
| chat | handleFreeText (describe) | "Describe orders" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-describe, 6 columns}, id) |
| chat | handleFreeText (echo, EN) | "hello there" | e2e/chat.test.ts | gmsg(chat, default, {kind mock-echo, turns 1}, en) + memory 2 baris |
| chat | handleFreeText (memori) | 2 pertanyaan berurutan | e2e/chat.test.ts | balasan kedua memuat "count: 16" + memory 4 baris |
| chat | handleFreeText (typing) | teks bebas | e2e/chat.test.ts | calls memuat sendChatAction sebelum balasan |
| forget | handleCommandText | `/forget` setelah chat | e2e/forget.test.ts | gmsg(forget, default, {}, id) + memory 0 baris |
| forget | handleCommandText (ulang) | chat lalu /forget lalu "hello" | e2e/forget.test.ts | echo baru + memory 2 baris |
| language | handleCommandText | `/language` (user en) | e2e/language.test.ts | sendMessage + gmsg(language, default, {}, en) + picker EN |
| language | handleCommandText (id) | `/language` (user id baru) | e2e/language.test.ts | sendMessage + gmsg(language, default, {}, id) + picker ID |
| language | handleCallbackQueryData | tombol Language | e2e/language.test.ts | editMessageText + gmsg(language, default, {}, en) |
| language | handleArgsCallbackQueryData (id) | callback lang-id | e2e/language.test.ts | gmsg(language, done, {lang Indonesia}, id) + /start ID |
| language | handleArgsCallbackQueryData (en) | callback lang-en | e2e/language.test.ts | gmsg(language, done, {lang English}, en) + /start EN |
| language | botLang tersimpan | switch ke id lalu chat | e2e/language.test.ts | balasan mock Indonesia ("Kamu bilang") |
| language | default EN | user baru tanpa pilihan | e2e/language.test.ts | balasan mock Inggris ("You said") |
| status | hookNotFoundPage (callback) | callback tak dikenal | e2e/status.test.ts | editMessageText + gmsg(status, nf, {}, id) |
| status | hookNotFoundPage (command) | `/does-not-exist` | e2e/status.test.ts | sendMessage + gmsg(status, nf, {}, id) |
| status | hookNotFoundPage (EN) | `/does-not-exist` (user en) | e2e/status.test.ts | sendMessage + gmsg(status, nf, {}, en) |
| status | handleFreeText bukan 404 | teks bebas "halo" | e2e/status.test.ts | balasan chat, bukan gmsg(status, nf) |
| hook | hookBeforeRoute (deny) | user tak diizinkan | e2e/coverage.test.ts | sendMessage penolakan ID, tanpa "aku DB Chat" |
| hook | hookBeforeRoute (allow) | user diizinkan | e2e/coverage.test.ts | /start tampil "aku DB Chat" |
| hook | hookBeforeRoute (no username) | user tanpa username | e2e/coverage.test.ts | /start tampil "aku DB Chat" |
| db | memory window cap | 12 turn ditambah langsung | e2e/coverage.test.ts | hanya 10 turn terakhir tersimpan |
| db | user idempotent | createIfNotExists 2x | e2e/db-lmdb.test.ts | created false kedua kali |
| db | seed dataset | list/count/get | e2e/db-lmdb.test.ts | 3 tabel, 12/10/16 baris, kolom orders |
| db | seed idempotent | ensureSeeded kedua kali | e2e/db-lmdb.test.ts | false, tetap 3 tabel |
| db | memory clear | add lalu clear | e2e/db-lmdb.test.ts | list 1 lalu 0 |
| db | usage | getMapSizeUsed | e2e/db-lmdb.test.ts | total > 0 |
| sync | executeSyncBlocksDescription | sync deskripsi | e2e/descriptions.test.ts | 2x setMyCommands, 6 command unik per bahasa, deskripsi EN/ID persis |
