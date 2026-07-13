# NusaProc — ERP Procurement Module

Full-stack implementation of the Purchase Request → Approval → Purchase Order →
Goods Receipt pipeline from `project/ERP Procurement Prototype.dc.html`
(Claude Design prototype) and the accompanying PRD.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) — single-page client UI + REST-ish API route handlers
- **Prisma 7** + **Postgres** (via `@prisma/adapter-pg`) for real, durable persistence
- No auth system: the prototype's "view as" role switcher is preserved as the
  UX, but every request is resolved server-side against a real seeded `User`
  row (via the `x-actor` header) and RBAC/scoping is enforced in the API
  routes, not just hidden in the UI.

## Getting started

1. Provision a Postgres database (Vercel Postgres, [Neon](https://neon.tech),
   Supabase, or local Postgres all work) and copy its connection string.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to that connection string.
3. Run:

```bash
npm install
npx prisma db push   # create tables from prisma/schema.prisma
npm run db:seed       # wipe + seed demo data (branches, users, PRs, POs, GRs, audit log)
npm run dev            # http://localhost:3000
```

The "Reset demo data" button in the app does the same seed in-place via `POST /api/reset`.

### Deploying (e.g. to Vercel)

Set `DATABASE_URL` as a project environment variable pointing at your Postgres
instance, then deploy as a standard Next.js app. Run `npx prisma db push` (or
`npm run db:seed` for demo data) against that same `DATABASE_URL` once before
first use — the build does not run migrations automatically.

## Structure

- `prisma/schema.prisma` — data model (Branch, Department, User, Vendor,
  ItemCatalogEntry, PurchaseRequest/PRLineItem, ApprovalRecord,
  PurchaseOrder/POLineItem, GoodsReceipt/GRLineItem, AuditLogEntry)
- `prisma/seed.ts` + `src/lib/resetDatabase.ts` — seed data (shared by the CLI
  seed script and the in-app reset endpoint)
- `src/lib/domain.ts` — business rules (approval matrix thresholds, PO
  approval threshold, GR tolerance, status labels/badge colors, formatting)
- `src/lib/viewmodels.ts` — shared DB-row → API-response shaping
- `src/app/api/**` — route handlers (requests, approvals, purchase-orders,
  goods-receipts, dashboard, audit, catalog, vendors, reset)
- `src/context/AppState.tsx` — client-side "which persona/module/view am I
  looking at" state (mirrors the prototype's internal view-state navigation)
- `src/components/screens/*` — one component per screen from the prototype

## Notes / deliberate deviations from the prototype

- Dates and SLA aging (`waitedDays`, PO `overdue`) are computed from real
  timestamps against the current server time, rather than frozen to the
  prototype's fixed "11 Jul 2026 today" — so the demo data ages realistically
  the longer it's left running.
- The procurement "default vendor by item category" auto-pick heuristic from
  the prototype was dropped in favor of just defaulting to the first vendor;
  the vendor is always user-editable before creating a PO.
