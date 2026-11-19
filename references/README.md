# References

This folder holds the original workflow file this project recreates, for
reference only. The bot itself does not use it at runtime.

- `n8n-2090-chat-with-a-database-using-ai.json` — the original workflow
  (id 2090, "Chat with a database using AI", 7 nodes), downloaded
  2026-11-19 from the public template API
  (`https://api.n8n.io/workflows/templates/2090`).

Original flow, in brief: a chat trigger receives the user's message, an AI
agent (GPT-4o-mini) answers it, with three attachments — a database tool
that runs AI-generated SQL (read-only), a Simple Memory window buffer, and
the OpenAI chat model. Two sticky notes suggest trying "Which tables are
available?" and note the database could be swapped for MySQL or SQLite.

In this project the database is LMDB (`@gramstax/lmdb`) instead of a SQL
server: the agent emits structured read-only queries (table + filters +
sort + limit + simple aggregates) that a typed executor runs against the
seeded demo dataset — no raw SQL strings are ever accepted.
