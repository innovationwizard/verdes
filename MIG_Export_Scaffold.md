# MIG Export — Coffee Export P&L Application

## Architecture Scaffold v1.0

---

## 1. Domain Model

The business is **coffee export**. Raw coffee is purchased in quintales (qq), processed (maquila), graded by quality, packed into containers, and shipped internationally.

### Core Concepts

| Concept | Description |
|---|---|
| **Contract** | A sale agreement with a buyer. The top-level business entity. |
| **Container** | A physical 20' or 40' shipping unit. The operational "puzzle piece." |
| **ContractContainer** | Join table. A contract can span multiple containers; a container can serve multiple contracts (pooling). |
| **QualityGrade** | Coffee classification (P1, P2, P3, S1, S2, GOP, YELLOW, MYQ, TRIP, ORO, TH, etc.). Extensible. |
| **ContainerAllocation** | What quality/kilos/price goes into a specific container for a specific contract. |
| **CostCategory** | Anexo grouping (purchasing, maquila, export fixed 20', export fixed 40', export variable, invoice-variable, admin). |
| **CostItem** | A specific cost line (e.g., "Fumigación", "MSC Naviera"). Has historical pricing. |
| **CostPrice** | A price record for a CostItem. Never updated — new records appended. Latest = active. |
| **Shipment** | Overarching operation grouping contracts + containers for a single export event. |

---

## 2. Database Schema (Supabase / PostgreSQL)

```sql
-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('master', 'operator', 'viewer');
CREATE TYPE container_size AS ENUM ('20ft', '40ft');
CREATE TYPE shipment_status AS ENUM ('draft', 'in_progress', 'complete', 'cancelled');
CREATE TYPE cost_category_code AS ENUM (
  'purchasing',        -- Anexo 1
  'maquila',           -- Anexo 2
  'export_fixed_20',   -- Anexo 3 fixed
  'export_var_20',     -- Anexo 3 variable
  'export_fixed_40',   -- Anexo 4 fixed
  'export_var_40',     -- Anexo 4 variable
  'invoice_variable',  -- Anexo 5
  'admin_fixed'        -- Anexo 6
);
CREATE TYPE allocation_input_mode AS ENUM ('kilos', 'percentage');

-- ============================================================
-- AUTH EXTENSION (profiles linked to Supabase Auth)
-- ============================================================

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'viewer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- REFERENCE DATA
-- ============================================================

CREATE TABLE quality_grades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,          -- 'P1', 'S1_7MM', 'GOP', etc.
  display_name  TEXT NOT NULL,                 -- 'P1', 'S1 +7mm', 'GOP', etc.
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bag_sizes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weight_kg     NUMERIC(8,2) NOT NULL,        -- 46, 69, etc.
  label         TEXT NOT NULL,                 -- '46 kg', '69 kg'
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COST STRUCTURE (Anexos)
-- ============================================================

CREATE TABLE cost_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        cost_category_code NOT NULL,
  name            TEXT NOT NULL,               -- 'Fumigación', 'MSC Naviera'
  sort_order      INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only pricing history. Latest per cost_item_id = active price.
CREATE TABLE cost_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_item_id    UUID NOT NULL REFERENCES cost_items(id),
  amount_gtq      NUMERIC(14,4),              -- Price in Quetzales (nullable if USD-only)
  amount_usd      NUMERIC(14,4),              -- Price in USD (nullable if GTQ-only)
  unit            TEXT NOT NULL DEFAULT 'flat', -- 'flat', 'per_qq', 'per_kg', 'pct_invoice'
  notes           TEXT,
  recorded_by     UUID REFERENCES user_profiles(id),
  effective_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cost_prices_item_effective
  ON cost_prices(cost_item_id, effective_at DESC);

-- ============================================================
-- SHIPMENTS & CONTRACTS
-- ============================================================

CREATE TABLE shipments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code    TEXT NOT NULL UNIQUE,       -- 'MIG-2024-001'
  label             TEXT,                       -- User-friendly name
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  status            shipment_status NOT NULL DEFAULT 'draft',

  -- Purchase inputs
  quantity_qq       NUMERIC(10,2) NOT NULL,     -- e.g., 233
  price_per_qq_gtq  NUMERIC(12,2) NOT NULL,    -- e.g., 8000
  bag_size_id       UUID NOT NULL REFERENCES bag_sizes(id),
  exchange_rate     NUMERIC(8,4) NOT NULL,      -- GTQ per USD, e.g., 7.75

  -- Merma
  merma_pct         NUMERIC(5,4) NOT NULL DEFAULT 0.03,

  -- Financial params
  interest_rate_annual NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  financing_months     NUMERIC(4,1) NOT NULL DEFAULT 1.0,
  isr_pct              NUMERIC(5,4) NOT NULL DEFAULT 0.25,

  -- Cloned from
  cloned_from_id    UUID REFERENCES shipments(id),

  created_by        UUID REFERENCES user_profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Snapshot of cost prices at time of shipment creation/lock
CREATE TABLE shipment_costs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  cost_item_id    UUID NOT NULL REFERENCES cost_items(id),
  cost_price_id   UUID NOT NULL REFERENCES cost_prices(id),  -- Which historical price was used
  override_amount NUMERIC(14,4),              -- If user overrides for this shipment
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, cost_item_id)
);

CREATE TABLE containers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  size            container_size NOT NULL DEFAULT '20ft',
  sequence_number INT NOT NULL DEFAULT 1,      -- Container 1, 2, etc. within shipment
  capacity_kg     NUMERIC(10,2) NOT NULL,      -- 10000 for 20', 23000 for 40'
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shipment_id, sequence_number)
);

-- What goes in each container
CREATE TABLE container_allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id      UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  quality_grade_id  UUID NOT NULL REFERENCES quality_grades(id),
  input_mode        allocation_input_mode NOT NULL DEFAULT 'kilos',
  kilos             NUMERIC(10,2) NOT NULL,
  percentage        NUMERIC(6,4),              -- Stored even if input was kilos (computed)
  sale_price_usd_kg NUMERIC(10,4) NOT NULL,    -- $/kg sale price for this quality
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(container_id, quality_grade_id)
);

-- ============================================================
-- CONTRACT LAYER (for pooling)
-- ============================================================

CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id     UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  buyer_name      TEXT,
  reference       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which portion of a container belongs to which contract
CREATE TABLE contract_container_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  container_id    UUID NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  share_pct       NUMERIC(5,4),               -- What % of container belongs to this contract
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contract_id, container_id)
);

-- ============================================================
-- COMPUTED VIEW: P&L per shipment (materialized for performance)
-- ============================================================

-- This will be a database function, not a view, because the P&L
-- calculation involves multiple steps. See Section 4.

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_container_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_costs ENABLE ROW LEVEL SECURITY;

-- Viewers: read all
-- Operators: read all, write shipments/containers/allocations
-- Master: full access

CREATE POLICY "all_read" ON shipments FOR SELECT USING (true);
CREATE POLICY "operator_write" ON shipments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role IN ('master', 'operator')
  )
);

-- Repeat pattern for other tables (omitted for brevity, same logic)
```

---

## 3. P&L Calculation Engine

The P&L is computed, never stored as raw values. Calculation order:

```
INPUTS
├── Purchase: quantity_qq × price_per_qq × bag_weight = total_purchase_gtq
├── Total Kilos Purchased: quantity_qq × bag_weight_kg
├── Exchange Rate: TC
│
├── Per Container:
│   └── Per Quality Allocation:
│       ├── kilos
│       └── sale_price_usd_kg
│
DERIVED
├── Total Kilos Sold: SUM(all allocations across all containers)
├── Merma (kg): total_kilos_purchased × merma_pct
├── Unaccounted Diff: total_kilos_purchased - total_kilos_sold - merma_kg
│   (displayed as merma — user confirmed all gaps = merma)
│
├── Revenue (USD): SUM(kilos × sale_price_usd_kg) per quality
├── Revenue (GTQ): revenue_usd × TC
│
├── COGS (purchase): quantity_qq × price_per_qq_gtq
├── COGS (USD): cogs_gtq / TC
│
├── Gross Margin: revenue - cogs
│
├── Operating Costs (from shipment_costs snapshot):
│   ├── Anexo 1: Purchasing costs (per qq)
│   ├── Anexo 2: Maquila (per qq)
│   ├── Anexo 3: Export fixed 20' (flat per container count)
│   ├── Anexo 3: Export variable 20' (per kg × container kg)
│   ├── Anexo 4: Export fixed 40' (flat per container count)
│   ├── Anexo 4: Export variable 40' (per kg × container kg)
│   ├── Anexo 5: Invoice-variable (% × total_revenue_usd)
│   └── Anexo 6: Admin fixed (flat, prorated if needed)
│
├── EBIT: gross_margin - total_operating_costs
│
├── Financial Cost: (cogs + operating_costs) × (annual_rate × months/12)
│
├── EBT: ebit - financial_cost
│
├── ISR: EBT × isr_pct (only if EBT > 0)
│
└── NET INCOME: EBT - ISR
```

This runs as a **TypeScript pure function** — no side effects, fully testable. Inputs in, P&L object out. Rendered client-side for instant reactivity when the user tweaks allocations.

---

## 4. Application Structure (Next.js 15 / App Router)

```
src/
├── app/
│   ├── layout.tsx                    -- Root layout, Supabase provider
│   ├── page.tsx                      -- Dashboard / shipment list
│   ├── login/page.tsx
│   │
│   ├── shipments/
│   │   ├── page.tsx                  -- Shipment list + "New Shipment" (clone flow)
│   │   └── [id]/
│   │       ├── page.tsx              -- THE main screen: shipment workspace
│   │       └── loading.tsx
│   │
│   └── admin/                        -- Master-only
│       ├── quality-grades/page.tsx   -- CRUD quality grades
│       ├── bag-sizes/page.tsx        -- CRUD bag sizes
│       ├── costs/page.tsx            -- Cost items + historical pricing
│       └── users/page.tsx            -- User management
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 -- Browser client
│   │   ├── server.ts                 -- Server client
│   │   └── middleware.ts             -- Auth middleware
│   │
│   ├── engine/
│   │   ├── pnl.ts                    -- Pure P&L calculation engine
│   │   ├── pnl.test.ts              -- Unit tests against known Excel values
│   │   └── types.ts                  -- Domain types
│   │
│   └── utils/
│       ├── currency.ts               -- Formatting GTQ/USD
│       └── clone.ts                  -- Shipment deep-clone logic
│
├── components/
│   ├── shipment/
│   │   ├── PurchaseInputs.tsx        -- qq, price, bag size, TC
│   │   ├── ContainerBuilder.tsx      -- Add/remove containers, set size
│   │   ├── QualityAllocator.tsx      -- THE key UX: allocate grades to container
│   │   ├── PnlSummary.tsx           -- The output: live P&L statement
│   │   ├── FinancialParamsModal.tsx  -- Interest, months, ISR
│   │   └── MermaControl.tsx         -- Merma % per shipment
│   │
│   ├── costs/
│   │   ├── CostCategoryPanel.tsx     -- Expandable anexo sections
│   │   └── NewPriceModal.tsx         -- Append new price (never update)
│   │
│   └── ui/                           -- Shared primitives
│       ├── Modal.tsx
│       ├── DataTable.tsx
│       └── ...
│
└── types/
    └── database.ts                   -- Generated from Supabase (npx supabase gen types)
```

---

## 5. Key Screens

### 5.1 Shipment Workspace (THE screen — 90% of user time)

Single page, three zones:

```
┌─────────────────────────────────────────────────────────┐
│  MIG-2024-003 · Draft                          [⚙] [📊] │
├────────────────────┬────────────────────────────────────┤
│  PURCHASE          │  CONTAINERS                        │
│  ───────────       │  ──────────                        │
│  233 qq            │  ┌─ Container 1 (20') ──────────┐  │
│  Q 8,000/qq        │  │  P1   2,600 kg   $33.00/kg   │  │
│  46 kg/qq          │  │  P2   1,800 kg   $38.50/kg   │  │
│  TC: 7.75          │  │  P3   1,600 kg   $36.00/kg   │  │
│  ───────────       │  │  S1   1,000 kg   $38.00/kg   │  │
│  Total: 10,718 kg  │  │  S2   1,000 kg   $32.75/kg   │  │
│  Merma: 3%  [✏]    │  │  GOP    900 kg   $29.25/kg   │  │
│                    │  │  TRIP 1,500 kg   $28.00/kg   │  │
│  [Financial ⚙]     │  │  ─────────────────────────    │  │
│  Rate: 10%         │  │  Total: 10,400 kg             │  │
│  Months: 1         │  │  Remaining: -400 kg ⚠️         │  │
│  ISR: 25%          │  └──────────────────────────────┘  │
│                    │  [+ Add Container]                  │
├────────────────────┴────────────────────────────────────┤
│  P&L SUMMARY                                            │
│  ───────────                                            │
│  Revenue         $351,775.00    Q 2,726,256.25          │
│  Purchase Cost   $240,516.13    Q 1,864,000.00          │
│  Gross Margin    $111,258.87        46.3%               │
│  Operating Costs  $23,223.58    Q   180,475.85          │
│  EBIT             $88,035.29        36.6%               │
│  Financial Cost    $3,221.20    Q    24,964.28          │
│  EBT              $84,814.10        35.2%               │
│  ISR              $21,062.62    Q   163,235.28          │
│  ──────────────────────────────────────────────         │
│  NET INCOME       $63,251.48    Q   489,705.84   26.3%  │
│  ──────────────────────────────────────────────         │
│  Total Kilos: 10,396  ·  $/kg: 6.08  ·  Merma: 321.54 │
└─────────────────────────────────────────────────────────┘
```

**Key UX decisions:**
- P&L recalculates live on every keystroke (pure function, no API call needed)
- Quality allocation uses inline editable cells — tab between kilos and price
- Toggle button to switch allocation mode: kilos ↔ percentage
- Container capacity bar (visual: green → yellow → red as it fills)
- Warning when total allocated ≠ (purchased - merma)

### 5.2 New Shipment Flow

1. Click "New Shipment"
2. Modal: "Clone from" dropdown (default: most recent complete shipment)
3. Option to clone from any shipment, or start blank
4. Deep clone: purchase params, containers, allocations, cost snapshot — all editable immediately
5. Land on Shipment Workspace in `draft` status

### 5.3 Admin: Cost Management

- Grouped by Anexo (accordion panels)
- Each cost item shows current price + "history" expandable
- "Record New Price" button → modal with amount, unit, notes, date
- Never edits. Only appends. History is immutable.

### 5.4 Admin: Quality Grades

- Simple table: code, display name, sort order, active toggle
- Master user only

---

## 6. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Your stack. SSR for initial load, client for reactivity. |
| Auth | Supabase Auth | Your choice. RLS policies keyed to `auth.uid()`. |
| Database | Supabase PostgreSQL | Your choice. Schema above. |
| ORM | Prisma | Your stack. Type-safe queries, migrations. |
| State | Zustand | Lightweight. Shipment workspace needs local reactive state for live P&L. |
| UI | shadcn/ui + Tailwind | Fast, composable, production-grade components. |
| P&L Engine | Pure TypeScript | Zero dependencies. Fully unit-testable. Runs client-side. |
| Validation | Zod | Schema validation for all inputs. Shared between client/server. |
| Deployment | Vercel | Your stack. |

---

## 7. Migration Path

### MVP (standalone)
- Supabase project: `mig-export`
- Vercel project: `mig-export`
- Domain: `mig.yourdomain.com` (or similar)

### Integration with Hope Coffee / Finca Danilandia
- Shared Supabase project (or cross-project DB links)
- Shared auth (same Supabase Auth instance → future Microsoft SSO)
- MIG Export becomes a module/route within the unified app
- Contracts can reference entities from Hope Coffee (buyers, lots, etc.)

---

## 8. Seed Data Required

Before building, I need from you:

1. **All current cost items with their latest prices** — the Anexo sheets have values but some are zero. Confirm which zeros are "genuinely zero" vs "not yet filled in."
2. **Quality grades** — confirm the full list. From the Excel I see: P1, P2, P3, S1 +7mm, S2 5-6mm, GOP, YELLOW (LG), MYQ, TRIP, ORO, TH. Correct?
3. **Bag sizes** — you said only 46kg recently. Any others to seed as inactive?

---

## 9. Open Design Decisions

| # | Question | My Recommendation |
|---|---|---|
| 1 | Should the P&L show the full Anexo breakdown or just the summary line? | Summary by default, expandable to full detail on click. |
| 2 | PDF/Excel export of the P&L? | Yes, Phase 2. Not MVP blocker. |
| 3 | Shipment status workflow: draft → in_progress → complete. Any other states? | Add `cancelled`. Keep it simple. |
| 4 | Container pooling UX: how does José indicate "this container is shared"? | Add a `contracts` layer. MVP can skip if José always does 1 contract = 1 shipment. |
| 5 | Multi-currency display: always show both GTQ and USD? | Yes, side by side, as in the Excel. |
| 6 | Historical comparison: "compare this shipment vs last shipment"? | Phase 2. High value but not MVP. |
