# PROJECT_RULES.md  (give this to your AI coding agent at the start of every task)

## Product
Multi-tenant billing + inventory app for small shops (grocery first, any retail later).
Users: shop owners with low tech literacy. Languages: Tamil + English. Often weak internet.
Top priority: **never lose or corrupt a bill or stock count.**

## Stack (do not change without asking)
- Frontend: React + TypeScript + Vite, Tailwind, installable PWA (vite-plugin-pwa)
- Offline storage: IndexedDB via Dexie; sync queue to the server
- Backend: Supabase (Postgres, Auth, Row Level Security, Edge Functions)
- AI: Gemini API called ONLY from an Edge Function (never from the browser)
- Hosting: Vercel or Cloudflare Pages (frontend), Supabase (backend)

## Folder structure
src/pages        screens (Login, Billing, Products, Stock, Reports, Customers)
src/components   reusable UI
src/lib          supabase client, money/quantity helpers, i18n
src/db           Dexie local database + sync queue
src/features     voice/, restock/, invoice-import/
supabase/migrations   SQL migrations (never edit applied migrations, add new ones)
supabase/functions    Edge Functions
tests/           unit + e2e

## Hard rules
1. Every table has shop_id. Every table has Row Level Security. No exceptions.
2. Bills are created only through the `create_bill` RPC. Never write bills, bill_items,
   or stock directly from the client.
3. The client generates the bill UUID (offline-safe, idempotent retries).
4. Money: numeric in the database, integers (paise) or a decimal library in JS.
   Never use floating-point math for money. Round only at the line level.
5. Prices come from the product catalog, never from AI output.
6. AI output is a SUGGESTION. The user must see an editable list and confirm before saving.
7. No secrets in the frontend or in git. Only the Supabase anon key is public.
8. Soft-delete (deleted_at) products and customers. Void bills, never delete them.
9. All user-facing text goes through i18n (ta + en). No hard-coded strings.
10. UI: large touch targets (min 48px), minimal screens, icons plus words, works at 360px width.

## Offline behavior
- Billing must work with no internet. Save locally, show "will sync" status, sync in background.
- Sync is idempotent. A retried request must never create a duplicate bill.
- Show a temporary bill number offline; the server assigns the final number.

## Quality rules
- TypeScript strict mode. No `any` without a comment explaining why.
- Unit tests for money math, stock math, voice-text parsing and sync logic.
- Test RLS: a user of shop A must never read or write shop B data.
- Every PR/task: lint, typecheck, tests pass. Small commits with clear messages.
- Handle errors visibly: no silent failures, show a clear message in Tamil/English.

## Definition of done (per feature)
Works offline if it is a billing/stock feature, tested on a real phone, error states handled,
Tamil + English text added, no console errors, committed to git.

## How to work
Do ONE small task at a time. Before coding, state the plan in 3-5 lines.
Ask if something is ambiguous. Never rewrite unrelated files.
