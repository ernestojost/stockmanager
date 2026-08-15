---
version: 1
slug: "frontend-src-pages-dashboard-jsx"
primary_target: "frontend/src/pages/Dashboard.jsx"
related_targets: ["frontend/src/components/ChartVentas.jsx"]
---

## Scope & mode

Route `/` (both AdminDashboard and VendedorLanding variants). Mode: Operate — this is an authenticated internal tool screen, not a marketing surface, even though it also serves as the project's portfolio "hero" (see PRODUCT.md).

## Audience, job, action

- **Admin**: checks today's health at a glance (total vendido, pedidos pendientes, top product), reads the sales trend, spots what's selling. Action: pick a period, scan, move to a task elsewhere in the app.
- **Vendedor**: lands here after login only to jump to a task (nuevo pedido, ver pedidos, ver productos). No data to read here — pure wayfinding.
- **Portfolio viewer**: skims for 30–90 seconds deciding whether this looks like real, working software.

## Proof / content

Real API data: `total_vendido_mes`, `pedidos_pendientes`, top 5 productos, and `ventas por período` (día/semana/mes) from `/api/dashboard/*`. No fabricated content — all figures are live.

## Constraints

- No new frontend dependency (no chart library, no icon font, no web font).
- Backend enforces admin-only access (403); the vendedor variant is a distinct, simpler component, not the same component with hidden sections.
- Must stay legible/functional at the app's existing breakpoint (mobile stacks to one column, per the existing `.cards-row`/`.pedido-nuevo-grid` pattern already in `index.css`).

## Chosen direction & memorable moment

**Register-Tape Ledger** (see DESIGN.md). Assigned by `concept-seed.mjs` (seed key `333827d7`, index 7 of the resonance-ordered candidate list: ledger/account-book, warehouse control room, trading-floor terminal, cargo manifest, industrial dial gauges, library card catalog, POS/register-receipt — POS/register-receipt was #7 and is what was built), confirmed by the user over the "Pipe Organ Keydesk" challenger via the decision page.

Memorable moment: the three KPI figures read like a receipt subtotal line — tabular monospace, black by default, only turning red/green when there's an actual signal — and the sales chart's bars sit on a dashed "tape" baseline instead of a solid axis.

## Unresolved decisions

- Whether Register Green (positive-comparison ink) ships in this pass or is deferred — the current dashboard.resumen API doesn't return a prior-period comparison, so there's no real signal to color green yet. Default: omit it from v1 rather than fabricate a comparison; note it as a natural backend follow-up (`ventas` endpoint already groups by period, so a "vs. previous period" delta is a small addition later).
