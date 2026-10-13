---
name: StockManager
description: Internal inventory & orders panel for a small business
colors:
  paper: "#f6f2e7"
  paper-raised: "#fbf9f2"
  ink-primary: "#1b1a17"
  ink-muted: "#58523f"
  ink-faint: "#a49d8a"
  rule: "#c9c2ae"
  stamp-indigo: "#2a3a8c"
  stamp-indigo-deep: "#1e2a68"
  register-red: "#a3271f"
  register-red-bg: "#f4e6e2"
  register-green-bg: "#e9ede2"
  register-green: "#3d5c33"
typography:
  data:
    fontFamily: "ui-monospace, 'SFMono-Regular', 'IBM Plex Mono', Menlo, Consolas, monospace"
    fontVariation: "tabular-nums"
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontWeight: 600
    letterSpacing: "0.08em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
rounded:
  none: "0px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  stat-ticket:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  period-toggle-active:
    backgroundColor: "{colors.stamp-indigo}"
    textColor: "{colors.paper-raised}"
    rounded: "{rounded.none}"
    padding: "5px 12px"
---

# Design System: StockManager — Register-Tape Ledger

## Overview

**Creative North Star: "Register-Tape Ledger"**

StockManager's Dashboard reads as a running paper tape, not a SaaS admin
template. Every figure looks freshly printed: tabular monospace numbers,
black-ink defaults with red-ink exceptions (the two-color ribbon
convention of a real cash register — black for the ordinary entry, red
for the one that needs attention), hairline rules and dashed perforations
standing in for card borders, and a single stamped indigo carrying every
interactive and "look here" moment. Nothing floats: no drop shadows, no
soft rounded cards — a ledger page is flat by nature.

This is currently the visual identity of the **Dashboard route only**
(`frontend/src/pages/Dashboard.jsx` and `frontend/src/components/
SalesChart.jsx`) — the surface that doubles as this project's portfolio
"hero" view (see PRODUCT.md, Product Principles §4). The rest of the app
(Products, Customers, Orders tables and forms, modals) intentionally
keeps the prior plain, dense CSS system in `frontend/src/styles/
index.css` — this is a deliberate scope boundary, not an oversight, and
extending the ledger world to those surfaces is a separate decision.

Confirmed visual rejection: no generic SaaS dashboard grammar — no soft
white cards with drop shadows, no rounded pill stat tiles, no
sans-serif-everywhere numeral treatment, no colored up/down trend arrows.

**Key Characteristics:**
- Warm paper ground, never stark white.
- All figures — money, counts, dates in data position — set in tabular monospace.
- Black ink is the default; red ink is reserved for what needs attention (never decorative).
- One accent only: stamped indigo, used sparingly for interactive/active state.
- Flat. No shadows, no rounded corners, no floating cards.
- Dividers are dashed rules or a perforation motif, never a solid card border.

## Colors

Warm paper ground with two-tone ledger ink (black/red) plus one stamped accent; nothing else.

### Primary
- **Stamp Ink Indigo** (`#2a3a8c`): the one accent. Active period-toggle state, primary buttons/links inside the Dashboard, the sales-chart bars, focus rings. Hover/pressed state deepens to **Stamp Ink Indigo Deep** (`#1e2a68`).

### Secondary
- **Register Red** (`#a3271f`) on **Register Red Wash** (`#f4e6e2`): reserved for negative/attention states inside the Dashboard — a low-stock signal, a cancelled-order figure. Never used for a primary action; its meaning must stay singular.
- **Register Green** (`#3d5c33`) on **Register Green Wash** (`#e9ede2`): the positive counterpart when a figure needs to read as healthy/on-track (e.g. a period's total above the prior one). Used at most as often as red — if both appear on a screen they must both be earned by an actual comparison, never applied decoratively.

### Neutral
- **Ledger Paper** (`#f6f2e7`): page background.
- **Raised Paper** (`#fbf9f2`): the tonal step used for a stat ticket or the chart panel — barely lighter than the page, never a hard white card.
- **Primary Ink** (`#1b1a17`): default text and figures.
- **Muted Ink** (`#58523f`): secondary text, axis labels, captions. Deepened from an initial `#6b6558` — that read right at the AA floor (~4.5:1) on the 11px tracked ticket/toggle labels, the smallest text on the surface.
- **Faint Ink** (`#a49d8a`): placeholder/disabled text only.
- **Rule** (`#c9c2ae`): hairline dividers, dashed perforations, chart baseline.

### Named Rules
**The Two-Ink Rule.** Every figure is black by default. It only turns red or green when it is reporting a real comparison or alert state — never as a style choice for a given card or row.

**The One Accent Rule.** Stamp Ink Indigo is the only color allowed to signal "interactive" or "current selection." If a second accent hue appears anywhere on the Dashboard, the system has drifted.

## Typography

**Data Font:** `ui-monospace, "SFMono-Regular", "IBM Plex Mono", Menlo, Consolas, monospace`
**Body/Label Font:** `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` (unchanged from the rest of the app — no new font dependency)

**Character:** Numbers are typed on a register, not designed on a poster — tabular monospace gives every total a fixed-width, receipt-like column alignment. Labels stay in the app's ordinary system sans, but tracked out and capitalized like a printed header, so the two registers (label vs. data) are always visually distinct.

### Hierarchy
- **Section title** (700, 20px, 1.2 line-height): page/section headings ("Dashboard", "Sales by period").
- **Stat value** (600, 26px, monospace, tabular-nums): the number in a stat ticket.
- **Stat label** (600, 11px, uppercase, letter-spacing 0.08em): the caption above a stat value, printed-header style.
- **Data cell** (400, 13–14px, monospace, tabular-nums): table figures, chart value labels, axis ticks.
- **Body** (400, 14px, sans): ordinary prose, muted captions.

### Named Rules
**The Monospace-For-Data Rule.** Anything that is a number a user might compare or total — money, counts, dates in a data column — sets in the monospace stack with `tabular-nums`. Anything that is prose does not.

## Layout

Dashboard content stays inside the app's existing `.content` container (max-width 1200px). Inside it, the ledger world uses a single-column rhythm of flat, full-width sections (stat row, chart panel, table) separated by a dashed rule rather than card gaps — the page reads as one continuous tape, not a grid of unrelated widgets. Section spacing is generous (24px) top-and-bottom; internal padding stays denser (16–20px) so the "tape" doesn't feel padded like a marketing page.

## Elevation & Depth

Flat by rule — no shadows anywhere on the Dashboard. Depth (what needs attention now vs. what's ambient) is conveyed by ink weight and the black/red/green convention, not by lifting elements off the page. A hovered/active element gets a filled indigo background or a heavier rule, never a shadow.

### Named Rules
**The Flat Tape Rule.** No `box-shadow` on the Dashboard surface, ever. If an element needs to stand out, it earns it with ink (color, weight) or a dashed perforation, not elevation.

## Shapes

Square corners throughout (`border-radius: 0`) — a receipt or ledger page has no rounded edges. The one recurring silhouette is the **perforation**: a dashed 1px rule (`border-top: 1px dashed var(--rule)`) marking the tear-line between sections, and a light sawtooth/zigzag bottom edge on the stat-ticket row evoking a torn receipt strip.

## Components

### Stat Ticket (replaces the generic "stat card")
- **Shape:** square corners, no border box — the ticket is defined by its dashed perforation edge, not a rectangle outline.
- **Background:** Raised Paper (`#fbf9f2`), barely distinct from the page.
- **Content:** uppercase tracked label on top (Muted Ink), then the value in monospace tabular figures (26px, Primary Ink by default; Register Red/Green only when the value is a signed comparison).
- **Layout:** three per row on desktop, stacking to one column under 640px; separated from each other by a dashed vertical rule, not a gap-and-shadow grid.

### Period Toggle (Day / Week / Month)
- **Shape:** square, sits together as one bordered strip (like punch-buttons on a register), not three separate pill buttons.
- **Default:** transparent, Muted Ink text, 1px solid Rule border between segments.
- **Active:** Stamp Ink Indigo fill, Raised Paper text — the only filled-color moment in the toggle group.
- **Hover (inactive segment):** Raised Paper background wash, no color change.

### Sales Chart (`SalesChart`)
- **Bars:** Stamp Ink Indigo, ≤24px thick, square at the baseline (no rounded cap — this diverges from the general dataviz-skill default specifically because the ledger world is square-cornered everywhere; consistency with Shapes wins here).
- **Baseline/gridline:** dashed Rule, not solid.
- **Value/axis labels:** monospace, Muted Ink.
- **Hover tooltip:** Raised Paper background, 1px solid Rule border (square corners), value in monospace Primary Ink.

### Top-Products Table
- Reuses the app's existing dense `.table` structure and behavior, restyled only in ink: header row in uppercase tracked Muted Ink on Raised Paper, body rows in Primary Ink with monospace figures in the numeric column, row dividers as hairline Rule (not the app-wide default border color).

### App Chrome Exception: the "Dashboard" Nav Pill
The topbar is shared, app-wide chrome (`Layout.jsx`) and stays outside this world — except its own "Dashboard" link, which uses Stamp Ink Indigo (`#2a3a8c`) instead of the app's default blue (`#2563eb`) when active. Two different saturated blues stacked in one eyeful (the active nav pill directly above the period toggle/chart) undercut the One Accent Rule the moment a viewer lands on `/`; unifying just that one link's active color is a scoped, disclosed exception, not a drift back toward re-theming the whole nav.

## Do's and Don'ts

### Do:
- **Do** set every money/count/date-in-a-data-column value in the monospace stack with `tabular-nums`.
- **Do** reserve Register Red and Register Green for an actual signed comparison or alert, never for decoration.
- **Do** use the dashed rule / perforation motif as the only "divider" device on this surface.
- **Do** keep Stamp Ink Indigo as the single accent; every other color on the Dashboard is ink-neutral (black/gray) or the red/green pair.
- **Do** close a short section (e.g. the seller landing's single ticket-link row) with a `.ticket-row-edge` perforation rather than letting it trail into empty paper — the tape has a visible end, not a fade-out.
- **Do** scope every Dashboard-world selector under `.dashboard-ledger` (or a component that only ever renders inside it) — a bare `.ticket`-style class name at the top level is a leak waiting to collide with a future unrelated component.

### Don't:
- **Don't** add a drop shadow anywhere on the Dashboard.
- **Don't** round a corner on the Dashboard — square only.
- **Don't** extend this world to Products/Customers/Orders without a separate decision; those surfaces keep the prior plain system on purpose.
- **Don't** introduce a second accent hue, an icon font, or a new web font — the monospace and sans stacks are both system fonts already available.
