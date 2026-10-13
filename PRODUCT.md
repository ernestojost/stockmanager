# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles sharing one internal panel:

- **Admin** — the business owner/manager. Manages the product catalog and pricing, reviews the stock-movement audit trail, watches the sales dashboard, exports order reports, and manages other users.
- **Seller** — a salesperson/employee. Registers customers, builds and confirms orders, updates order status. Read-only on the product catalog; no access to the financial dashboard, exports, stock history, or user management.

Both are internal staff of a small business (not customers, not the public). The job in both cases is transactional and repetitive: look something up, register something, move to the next task.

## Product Purpose

StockManager is real-time inventory and order management for a small business: track stock as it's sold, prevent overselling, register customers and orders, and see at a glance what's moving and what's low.

## Positioning

A self-built, from-scratch alternative to an off-the-shelf e-commerce/POS platform. The point is to demonstrate real relational data modeling, a hand-designed REST API, and React fundamentals (routing, state, data fetching) without leaning on a meta-framework or a component library.

## Operating Context

- SPA (React + Vite + React Router) against a separate Express + MySQL API, run locally via Docker Compose.
- Internal panel, not customer-facing: dense tables, quick forms, keyboard-friendly data entry.
- Core workflow: create an order by searching a product, adding it to a running cart, adjusting quantity, watching the total update live, then confirming — stock decrements immediately and is restorable on cancellation.
- Every stock change (initial stock, manual adjustment, sale, cancellation) is written to an audit trail (`stock_movements`) with who did it and the resulting stock level.
- Admin-only: product CRUD, dashboard/sales chart, CSV/PDF export of orders, user management. Enforced both in the API (403) and in the UI (controls hidden for `seller`).
- The business vertical is intentionally generic — seed data happens to be a small hardware & general store (hand tools, fasteners, paint & supplies, cleaning) but nothing in the product should commit to that vertical specifically.

## Capabilities and Constraints

- No dark mode — single light theme only.
- Plain CSS design system (CSS custom properties, no Tailwind/component library).
- No charting library — the sales-by-period chart is hand-rolled inline SVG.
- No new frontend dependencies as a rule — the from-scratch approach is deliberate, not a limitation to work around.
- Backend is the source of truth for permissions (403 on unauthorized routes); the frontend hides what a `seller` can't use, it doesn't just disable it visually.

## Brand Commitments

Name: **StockManager**. No existing logo or locked visual identity — this is greenfield for visual design purposes.

## Evidence on Hand

Working seed data exists (categories: Hand Tools, Fasteners, Paint & Supplies, Cleaning; products like "Claw Hammer 16 oz", "Interior Latex Paint, 1 gal", etc.) but this is placeholder demo data for a generic small store, not a committed brand or vertical. Two demo accounts exist end-to-end: `admin@stockmanager.com` / `admin123` and `seller@stockmanager.com` / `seller123`.

## Product Principles

1. **Speed and low-friction data entry outrank visual flourish for the real day-to-day tasks** (creating an order, checking stock) — this is a tool people use dozens of times a day, not a page they admire.
2. **Trust is visible, not just enforced.** Validations that prevent overselling or negative stock/price, and the stock audit trail, exist so the business can trust the numbers — the UI should make that traceability legible, not hide it behind a raw log.
3. **Role clarity is part of the product experience.** Admin and seller should feel like two purpose-built views, not one view with some buttons missing.
4. **This Dashboard surface currently doubles as the project's portfolio "hero" view.** For this redesign specifically, making a strong first impression takes priority over maximal information density — the rest of the app (tables, forms) stays dense and utilitarian.
5. **No new frontend dependencies.** The plain-CSS, hand-rolled-SVG approach is a deliberate demonstration of fundamentals.
