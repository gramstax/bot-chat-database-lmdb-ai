# AGENTS.md

## STRICT RECREATE RULES (Damar, 2026-11-19 — apply to this project AND every
## future recreate project, no exceptions)

1. **English only in repo content**: repo description + README.md in
   English; README follows the `create-gramstax` 6.1.0 template style
   (title + badges, Features, Quick Start, Scripts table, Project
   Structure, Configuration, Testing, Deployment, Tech Stack, License).
2. **Original-flow source lives in `references/`** (NEVER `assets/`).
   Do NOT name the original workflow tool in the repo description,
   `package.json` description, or main README.md — it is only a
   reference inside `references/` (its README + the JSON file name).
3. **README.md MUST contain a Mermaid flowchart** of this project's
   own code flow.
4. **Repo description MUST start with 1 emoji**, English. The
   description says "ask in English or Indonesian" (Damar, 2026-11-19
   ~16:21 WIB) — NEVER "plain English" only: the bot is multilingual,
   and the README intro + start/help templates must say the same
   ("in English or Indonesian"), not "plain English".
5. **Bilingual, English by default**: every user-facing message is
   English by default AND Indonesian. Language is stored per user in
   LMDB (`UserSchema.botLang`), changed with `/language`; follow
   `gramstax-best-practices` and `lmdb-best-practices` (6.1.0).
6. **Commands are ENGLISH ONLY (Damar, 2026-11-19 ~15:22 WIB).** There
   is NO `intentCommandText` in any page's `buildData()`:
   `static data = this.buildData()` (or with a callback-args function
   where the page has one), and the command is the page name:
   `/tables`, `/schema`, `/language`, `/forget` (+ `/start`, `/help`).
   Message CONTENT is still bilingual (rule 5/7) — an English command
   from an Indonesian user renders in Indonesian; the stored `botLang`
   (applied by `hookBeforeRoute`) selects the RENDER language. The
   free-text handler (`chat.ts`) is not a command — never force it
   into one.
7. **Localization = static template blocks ONLY. `src/lib/i18n.ts` is
   FORBIDDEN (Damar, 2026-11-19 ~14:43 WIB — "tidak berguna").** Every
   user-facing message lives in the page's `static template`:
   `<g-message>` / `<g-message lang="id">`, `<g-switch>`, `<g-map>`,
   `<g-ifelse>` (EN default + ID variant). Helpers and services only
   compute DATA (render state, list rows, machine-readable error codes)
   and pass it as template variables — never a localized sentence.
   There is no string dictionary anywhere in the code; the only
   language helper is `src/lib/lang.ts`, which resolves the language
   CODE (`en` | `id`), never a message. The two documented exceptions
   are NOT user-facing: the LLM system prompt and the model-facing
   tokens in `src/lib/dbchat.ts` (`formatForModel`, `memoryText`).
   Docs: gramstax.mintlify.site; skill `template-i18n.md` and the other
   `template-*` references; patterns copied from `example/1-complex`
   in the gramstax repo.
8. **Repo names**: recreate projects start with `bot-*` + a
   representation of the flow (e.g. `bot-chat-database-lmdb-ai`).
   `chad-bot*` is reserved for a LATER variant whose behavior is
   changed to not depend on third parties ("chad" = the programmer meme
   of fully automating without hassle).
9. **Every recreate project MUST have `references/`** with the original
   workflow's `.json` file.
10. **No Gramstax ecosystem version in the repo description** (Damar,
    2026-11-19 ~14:35 WIB). The description names Gramstax, never its
    version number.
11. **A repo name represents the PROJECT, not the original flow's name**
    (Damar, 2026-11-19 ~14:35 WIB). Never rename a published repo to fix
    a name — renaming breaks its URL. Get the name right at creation.
12. **Recreate repos are PUBLIC from the start** (Damar, 2026-11-19
    ~14:35 WIB). Never create one private.
13. **README language is firm, human, and clear** (Damar, 2026-11-19
    ~14:35 WIB). Rewrite stiff or hesitant sentences; stay accurate and
    honest — never claim a feature that does not exist.
14. **Every README promotes the Telegram-bot service at the TOP**
    (Damar, 2026-11-19 ~14:35 WIB): one short block right under the
    title/badges, before Features, in English, linking Telegram
    @damartripamungkas — placed to fit, never in the way.
15. ~~Emoji on every README parent heading~~ — **REVOKED by Damar
    2026-11-19 ~14:40 WIB: this rule is deleted.** README `##` headings
    carry no emoji.
16. **When building with Gramstax is hard, read the framework's own
    `example/` code (Damar, 2026-11-19 ~14:45 WIB).**
    https://github.com/gramstax/gramstax/tree/main/example/ (e.g.
    `example/1-complex`) — copy the pattern used there when the docs or
    a skill does not explain a template syntax (loops, conditionals,
    `g-message` lang variants). Docs + skill first, example code when
    they are not enough.
17. **Conventional Commits with scope (Damar, 2026-11-19 ~14:49 WIB).**
    Every commit message is `type(scope): subject`, e.g.
    `feat(pages): ...`, `fix(language): ...`, `chore(...): ...`.
    Never a free-form message.
18. **Every project MUST have CODE_OF_CONDUCT.md, CONTRIBUTING.md, and
    SECURITY.md in the repo root (Damar, 2026-11-19 ~14:49 WIB).**
    English, standard content fitting the project; security reports go
    to Telegram @damartripamungkas — never claim a channel that does
    not exist.
19. **Every repo MUST have TOPICS for SEO (Damar, 2026-11-19 ~14:49
    WIB)**, representing the project, set via
    `gh repo edit <owner>/<repo> --add-topic ...` and verified with
    `gh api repos/<owner>/<repo> --jq '.topics'`. Check existing topics
    first; never add a duplicate.
20. **Page file names are ENGLISH only (Damar, 2026-11-19 ~14:55 WIB).**
    `tables.ts`, `schema.ts`, `chat.ts`, `forget.ts` — never an
    Indonesian file name. Commands are English only too (rule 6): the
    file name IS the command. Rename with `git mv` so history
    survives; rename the page class too and every import, e2e mirror
    file, and `e2e/COVERAGE.md` row. A rename changes the route (file
    name = route name in Gramstax 6.1.0), so e2e must prove the English
    command reaches the page.
21. **Command descriptions sync via `<g-description>` (Damar,
    2026-11-19 ~14:55 WIB).** Every command page declares its
    description in its OWN template's default `<g-base>`: one block
    with the original English text plus one `<g-description lang="id">`
    with the Indonesian text. The framework syncs them to the BotFather
    command list at bot start (`executeSyncBlocksDescription` →
    `setMyCommands`, one call per language). **Framework finding
    (verified 2026-11-19 from the framework source + a probe): the
    descriptions CANNOT be centralized in `start/index.ts` — the sync
    reads `getGDescription("<page-name>", "default", lang, scope)`, so
    a description placed in start's template would only ever sync
    /start.** Each page carries its own block; `e2e/descriptions.test.ts`
    proves the sync sees all 6 commands. **Confirmed by Damar
    2026-11-19 ~15:22 WIB: `<g-description>` is PER PAGE** — e.g.
    /start's description is for that command — so it MUST be defined
    in EVERY page that has a command handler (`handleCommandText` /
    `handleCommandArgsText`): all 6 command pages carry their own
    EN + `lang="id"` blocks; pages without a command handler
    (`chat.ts` free text, `status.ts`) carry none.
22. **Multi-language keyboards are defined ONCE in
    `src/blocks/g-keyboard.ts` (Damar, 2026-11-19 ~14:58 WIB).** One
    `{default, id}` label object per keyboard in
    `KeyboardGBlock.label`, one builder method per keyboard
    (`mainMenu()`, `languagePicker()`, `home()`, `back()`, …) — the
    framework's `_build` emits BOTH `<g-keyboard>` variants from that
    single definition. No page template ever writes the EN and ID
    keyboards twice. The template supplies the labels per language;
    the handler wires each label position to its callback
    (`inlineKeyboardT(...)` / `inlineKeyboard(...)`). E2E must prove
    the keyboard shows the right labels in both languages
    (`e2e/start/index.test.ts`, `e2e/language.test.ts`).
23. **AI model + base URL are configurable via `.env` (Damar,
    2026-11-19 ~16:10 WIB).** `OPENAI_BASE_URL` (default
    `https://api.openai.com/v1`) and `OPENAI_MODEL` (default
    `gpt-4o-mini`) are read in `AppConfig.load()` and passed through
    `DbChatService.chat()` into `OpenAIClient.chat()` — never hardcode
    the model or the chat URL in `src/lib/dbchat.ts` or
    `src/lib/openai.ts`. Mock rule: `DBCHAT_MOCK_AI=1` forces mock;
    otherwise a key means live; no key + default base URL means mock;
    no key + a custom base URL means LIVE without a key (free
    OpenAI-compatible providers, e.g. Pollinations
    `https://text.pollinations.ai/openai` with model `openai`).
    `OpenAIClient` only sends the `Authorization` header when a key is
    set. **Rate-limit retry (added 2026-11-19 after live 402 errors
    on free-text questions):** `OpenAIClient.chat` retries 402/429 up
    to 3 times, waiting the provider's "Retry after Ns" (default 45 s,
    cap 60 s) — a question needs several model calls (tool rounds),
    and without the retry every burst fails on the free tier. Covered
    by unit tests in `test/openai.test.ts` (with "Retry after 0s" so
    the suite stays fast).
24. **ALWAYS validate the README Mermaid flowchart before commit/push
    (Damar, 2026-11-19 ~16:13 WIB).** The diagram must render with
    0 errors — never commit a broken / non-rendering diagram. Extract
    the ```mermaid block from README.md and render it (one-off
    `mermaid` + `jsdom` validator in `/tmp/mermaid-check/validate.mjs`,
    or `mermaid-cli` `mmdc` when available) until parse is clean AND a
    real SVG is produced. **CORRECTION 2026-11-19 ~16:30 WIB (verified
    on live GitHub): local mermaid v11 parse can PASS while GitHub's
    renderer FAILS. The DB Chat diagram failed on GitHub with
    "Parse error on line 6 ... Expecting 'SQE' ... got 'STR'" because
    of `PAGES["Static pages<br/>template EN + lang='id'"]` — GitHub's
    parser chokes on `=` and nested quotes inside node text. RULE:
    NEVER put `=` or nested quotes inside a Mermaid node label; write
    plain words instead (e.g. `template EN and ID`). The final check
    MUST be the rendered diagram on the live GitHub README page, not
    just a local parse.** Render output stays in `/tmp`, never
    committed.

## DB Chat — project notes (2026-11-19)

- This bot recreates the original workflow 2090 (see `references/`).
  The code-flow mapping is in `README.md`.
- **Db is NOT the scaffold singleton**: `src/db/index.ts` follows the
  sister-bot pattern — `BotCore` owns `db` as an instance field,
  injected into ctx (`this.db`). There is no `Db.open/get/start/stop`.
- **No worker-thread, no voice, no Google tools.** The only LMDB
  stores are `user`, `memory`, and `tables` (demo dataset).
- **The agent never writes SQL.** `DbChatService` exposes three tools
  (`list_tables`, `describe_table`, `run_query`); `run_query` takes a
  structured `IStructuredQuery` object that `QueryExecutor` validates
  (known table/fields, whitelisted operators and aggregates) before
  running. There is no code path that executes a raw string as a query.
- **Guard username scaffold TIDAK dipakai**: `hookBeforeRoute` only
  does best-effort user registration + AllowList
  `DBCHAT_ALLOWED_IDS`.
- **Nama file page = nama route/command**: `tables.ts` → `/tables`.
  Commands are English only (strict rule 6).
- Render dari pesan memakai `sendMessage` (bukan `sendRichMessage`)
  di Gramstax 6.1.0 — tes e2e menyesuaikan ini.
- `DBCHAT_MOCK_AI=1` di `e2e/setup.ts`: e2e berjalan tanpa kunci live.
- **Demo dataset**: `src/lib/seed.ts` (customers 12, products 10,
  orders 16), seeded idempotently by `TableRepository.ensureSeeded()`
  from `hookAfterStart` (and explicitly in `e2e/setup.ts`, because
  `hookAfterStart` does not run under `deploy: "test"`). To replace
  the data, edit the seed tables and clear `DB_PATH`.

Guidance for coding agents working in this generated Gramstax app. Read `README.md`, `package.json`, `gramstax.config.ts`, and the actual source before changing behavior.

## Project Truth

- This is a **Bun-only** Gramstax app. `gramstax start`, the test runner, and the build all run on Bun. Do not add a Node app runtime, Jest, or Vitest.
- `gramstax.config.ts` is the composition point. `gramstax start` discovers the `Gramstax` subclass at `src/core/bot.ts`; there is no `src/index.ts`.
- `src/core/ctx.ts` extends the Gramstax `Ctx` class. `src/core/services.ts` wires the optional services that were kept at scaffold time.
- `e2e/setup.ts` is the only place that constructs `BotCore` directly. It uses `deploy: "test"`, a test token, and an explicit `TemplateManager` path.
- `~/*` resolves to `src/*`. Package imports use the names recorded in `package.json`; `gramstax` is the framework import.
- The route tree is `src/pages/`. The `e2e/` tree mirrors it one-to-one.

## Commands

Run these from the project root:

```bash
bun run dev
bun run start
bun run build:gramstax
bun run typecheck
bun run test
bun run test:e2e
bun run test:e2e:check
bun run test:all
```

## Configuration

- `.env` is created during scaffolding and is gitignored. Keep it local; never commit tokens or secrets. The scaffold does not keep a second environment example file; document new environment variables in `README.md`.
- The generated variables are `BOT_TOKEN`, `BOT_DEPLOY`, `CACHE_SESSION_STORE`, `CACHE_SESSION_TTL`, and `CACHE_SESSION_NAMESPACE`. With LMDB enabled, `DB_PATH` is appended and defaults to `./data`.
- `BOT_DEPLOY` defaults to `polling`. The normal modes are `polling`, `webhook`, and `serverless`; the framework also recognizes `raw` (bare grammY) and `test` (the e2e harness).
- Webhook and serverless settings live in `optionsDeploy` in `gramstax.config.ts`. Their secret comes from the `BOT_WEBHOOK_SECRET` runtime binding (for example, `wrangler secret put BOT_WEBHOOK_SECRET`), never a literal in the config file.
- `log.override` entry points at `src/helpers/log.ts`, which exports `LogHe`. Use `LogHe` for application logging.

## Pages, Guards, and Templates

- A page is a class under `src/pages/` extending `PageBase`. Page behavior lives in its `show`/`process` steps, route handlers, sessions, and `static template`.
- `src/base/page.ts` is the shared page base. `src/base/guard.ts` is the guard base. `src/base/page-admin.ts` is an optional admin-gate base; extend it only for pages that need that gate.
- `src/blocks/g-keyboard.ts` contains the reusable keyboard builders. Prefer the shared `KeyboardGBlock` helpers over duplicating labels or keyboard structures.
- The scaffold's `UserGuard.ensureUsername()` rejects users without a Telegram username. That is a product decision; change it deliberately if this bot should allow them.
- Add or rename a page under `src/pages/` and update its mirror at the same relative path under `e2e/`. For example, `src/pages/foo.ts` pairs with `e2e/foo.test.ts`, and `src/pages/start/index.ts` pairs with `e2e/start/index.test.ts`.
- `e2e/COVERAGE.md` is the handler/test ledger. Every `handle*` the page defines needs a row that names the test proving it; every test file needs to be referenced. `bun run scripts/check-e2e-handlers.ts` fails when either side is missing.
- Run `bun run test:e2e:check` after adding, renaming, or removing a page or handler. It runs the bidirectional mirror check and the ledger audit.
- `g-*` template blocks, filters, keyboards, and AOT constraints are governed by the Gramstax best-practice rules. Prefer page classes and framework helpers over hand-written Telegram API calls.
- `optionsPage.shortCallbackQueryData` is enabled. Use page classes and keyboard helpers instead of hard-coded callback strings.
- `gramstax build` writes `.gramstax/`. Change the page or config source and rebuild; never hand-edit that tree.

## Optional Features

Check the project before assuming an optional feature exists.

| Feature | Enabled looks like | Disabled means |
| --- | --- | --- |
| LMDB | LMDB dependency in `package.json`; `src/db/` exists; `src/types/user.ts` exists; `DB_PATH` is set | No `src/db/`, no LMDB dependency, no user types |
| Worker threads | Worker dependency in `package.json`; `src/workers/` exists; `src/types/job.ts` exists | No `src/workers/`, no worker dependency, no job types |

`src/core/services.ts` is generated to match the features kept at scaffold time. After generation it is ordinary app code. If you add or remove an optional service, update `services.ts` and its imports deliberately.

### LMDB

- `src/db/index.ts` defines the process-wide `Db` singleton. `Db.start()` opens it through `Db.open()`; `Db.get()` returns the open instance.
- The default store path is `process.env.DB_PATH` or `./data`. `data/` is runtime state.
- `Db.start()` also starts the scaffold's restart-safe `nightly-report` schedule through `LmdbJobRun`. Keep or replace that schedule intentionally.
- Schemas live under `src/db/schema/`; repositories live under `src/db/repositories/`. Keep storage operations behind repositories rather than scattering raw store calls through pages.
- When both features are present, `ServicesCore.stop()` stops workers before `Db.stop()`. Keep that order: a worker can still be reading when shutdown begins.

## Code Conventions

- Follow the scaffold's class-based style under `src/`: behavior lives on classes, including static lifecycle methods. Avoid module-level exported functions and module-level async function constants.
- Match the existing private-member convention: private fields use an underscore prefix, including private static fields.
- Route all logging through `LogHe` from `~/helpers/log`. Do not call `console.*` under `src/`.
- TypeScript is strict and enables `noUncheckedIndexedAccess`. Prefer precise types over `any`; narrow casts when the boundary truly requires one.
- Keep shared domain types in `src/types/<domain>.ts`. Do not declare page/domain interfaces inline when they are reused.
- Keep runtime artifacts such as `logs/`, `data/`, and `.gramstax/` out of source changes. Do not edit `node_modules` or installed package source.

## Best-Practice Skills

If this project has the Gramstax skills installed, load the matching one before designing app behavior:

- `gramstax-best-practices` for pages, templates, keyboards, guards, config, e2e, deploy, and cache.
- `lmdb-best-practices` only when `src/db/` and the LMDB dependency are present.

If the skills are not installed, use the installed package READMEs and the Gramstax repository docs. Do not treat current `main` rules as valid for a pinned older dependency without checking the installed version.

## Verification

A change is complete only when the relevant current commands pass and their output has been read:

```bash
bun run typecheck
bun run test:all        # includes test:e2e:check (mirror + coverage ledger)
bun run build:gramstax
bun run start -- --help
git diff --check              # only when this project is a git repository
```

For a page change, exercise the real Telegram flow with `bun run dev` and record the steps and expected messages. For an LMDB change, check restart and existing data. Do not claim a phase is complete from a prior run, a subagent summary, or "the code looks right."

## Do Not

- Do not add a Node runtime, Jest, or Vitest.
- Do not edit `node_modules`, installed package source, or `.gramstax/` output.
- Do not commit `.env`, tokens, runtime data, logs, or generated build output.
- Do not add or rename a page without its `e2e/` mirror and its `e2e/COVERAGE.md` rows.
- Do not assume LMDB or worker directories exist; check `package.json` and the tree first.
- Do not replace the scaffold's page/template wiring with raw Telegram API calls without a specific reason.
