# MIG Export — Implementation Plan

## Context

Jorge is building "MIG Export," a Next.js 15 application that replaces an Excel template (Verdes.xlsx) used by José Herrera to calculate profit/loss on **cardamom** export shipments. The goal is maximum simplicity and best UX. All user-facing text in Latin American Spanish.

The Excel has cross-sheet reference issues (Anexo 5 costs shared between scenarios). The app fixes this by computing each shipment independently.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth + DB | Supabase (`ilektlmqjaujxuaomzld.supabase.co`) |
| DB Client | Supabase JS + generated types (no Prisma) |
| State | Zustand (live P&L reactivity) |
| UI | shadcn/ui + Tailwind CSS |
| Validation | Zod |
| P&L Engine | Pure TypeScript (zero deps) |
| Testing | Vitest |

---

## Schema Decisions (differing from scaffold)

- Role enum: `'master' | 'operator' | 'gerencia'` (not 'viewer')
- No contracts/pooling layer (MVP skip)
- No `bag_sizes` table — store `bag_weight_kg` directly on shipment
- Single `amount` + `currency` column on cost_prices (not dual amount_gtq/amount_usd)
- `admin_fixed_usd` stored directly on shipment (default 500, overridable)
- Quality grades get a `tier` column ('top', 'medium', 'low') for UI grouping

---

## Phases

### Phase 1: Project Scaffold

- `npx create-next-app@latest mig-export --typescript --tailwind --app --src-dir --eslint`
- Install: `@supabase/supabase-js`, `@supabase/ssr`, `zustand`, `zod`, `lucide-react`, `vitest`
- `npx shadcn@latest init` + install components: button, input, label, card, dialog, select, table, tabs, badge, separator, tooltip, accordion, progress, sheet, dropdown-menu, toast
- Configure: `lang="es"`, strict TS, primary color `#1D9E75`

**Files to create:**

```
mig-export/
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── vitest.config.ts
├── src/
│   ├── middleware.ts                   # Auth middleware, protect routes
│   ├── lib/
│   │   ├── utils.ts                   # cn() utility
│   │   └── supabase/
│   │       ├── client.ts              # Browser Supabase client
│   │       ├── server.ts              # Server Supabase client
│   │       └── middleware.ts          # Auth refresh middleware
│   └── app/
│       ├── layout.tsx                 # Root layout, lang="es", Inter font
│       └── page.tsx                   # Redirect to /embarques
```

---

### Phase 2: Database Schema (Supabase SQL Migrations)

**Migration 1: Enums and Tables**

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('master', 'operator', 'gerencia');
CREATE TYPE container_size AS ENUM ('20ft', '40ft');
CREATE TYPE shipment_status AS ENUM ('draft', 'in_progress', 'complete', 'cancelled');
CREATE TYPE cost_category_code AS ENUM (
  'purchasing', 'maquila',
  'export_fixed_20', 'export_var_20',
  'export_fixed_40', 'export_var_40',
  'invoice_variable', 'admin_fixed'
);
CREATE TYPE allocation_input_mode AS ENUM ('kilos', 'percentage');
```

**Tables:**

| Table | Key columns |
|---|---|
| `user_profiles` | id (FK auth.users), full_name, role (user_role, default 'gerencia') |
| `quality_grades` | code (unique), display_name, tier ('top'/'medium'/'low'), sort_order, is_active |
| `cost_items` | category (cost_category_code), name, sort_order, is_active |
| `cost_prices` | cost_item_id (FK), amount (numeric 14,4), currency ('GTQ'/'USD'), unit ('flat'/'per_qq'/'per_kg'/'pct_invoice'), notes, recorded_by, effective_at |
| `shipments` | reference_code (unique), date, status, quantity_qq, price_per_qq_gtq, bag_weight_kg (default 46), exchange_rate, merma_pct (default 0.03), interest_rate_annual (default 0.0975), financing_months (default 1.5), isr_pct (default 0.25), admin_fixed_usd (default 500), cloned_from_id (self-FK), created_by |
| `shipment_costs` | shipment_id (FK), cost_item_id (FK), amount, currency, unit. Unique(shipment_id, cost_item_id) |
| `containers` | shipment_id (FK), size (container_size), sequence_number, capacity_kg. Unique(shipment_id, sequence_number) |
| `container_allocations` | container_id (FK), quality_grade_id (FK), input_mode, kilos, percentage, sale_price_usd_kg. Unique(container_id, quality_grade_id) |

**Migration 2: RLS Policies**

```sql
-- Helper function
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- All authenticated: SELECT
-- master + operator: INSERT/UPDATE/DELETE on shipments, containers, allocations, shipment_costs
-- master only: INSERT/UPDATE/DELETE on cost_items, cost_prices, quality_grades, user_profiles
-- gerencia: read-only everywhere
```

**Migration 3: Seed Quality Grades**

| Sort | Code | Display Name | Tier |
|---|---|---|---|
| 1 | P1 | P1 | top |
| 2 | P2 | P2 | top |
| 3 | P3 | P3 | top |
| 4 | S1_7MM | S1 +7mm | medium |
| 5 | S2_5_6MM | S2 5-6mm | medium |
| 6 | GOP | GOP | low |
| 7 | YELLOW | YELLOW (LG) | low |
| 8 | MYQ | MYQ | low |
| 9 | TRIP | TRIP | low |
| 10 | ORO | ORO | low |

**Migration 4: Seed Cost Items + Current Prices**

All cost items from Anexos 1-6 with their current prices from the Excel:

- **Anexo 1 (purchasing, per_qq, GTQ):** Flete Interno (Q0), Carga/Descarga (Q0), Costo seguro (Q0), Patrulla custodio (Q0), Sacos (Q0), Bolsa (Q0), Comisión Compra (Q0)
- **Anexo 2 (maquila, per_qq, GTQ):** Maquila (Q170)
- **Anexo 3 fixed (export_fixed_20, flat, GTQ):** Banco Industrial (Q271.25), BAM SWIFT (Q155), Certificado Origen (Q123.30), Fitosanitario (Q49.68), Fumigación (Q1,309.29), Certificado Peso/Calidad (Q1,743.75), Agente Aduanal (Q591.87), DHL muestra (Q1,162.50), Deprex (Q99.98), Logística (Q3,875), Custodio puerto (Q643.25), Flete Puerto (Q10,075), MSC Naviera (Q27,512.50)
- **Anexo 3 var (export_var_20, per_kg, GTQ):** Cajas Master (Q0.5559), Caja Inner (Q0.8005), Fleje (Q0.0266), Grapa Fleje (Q0.0023), Grapa caja (Q0.0440), Bolsas negras (Q0.1263), Stickers (Q0), Sellos 5kg (Q0.0207), Sellos 40kg (Q0.0561)
- **Anexo 4 fixed (export_fixed_40, flat, GTQ):** Same items as Anexo 3 fixed but with 40ft values (Naviera Q38,258.04, etc.)
- **Anexo 4 var (export_var_40, per_kg, GTQ):** Same items as Anexo 3 var but with 40ft values
- **Anexo 5 (invoice_variable, pct_invoice, USD):** Seguro Carga (0.25%), BAM (0.15%), BAM Cobranza (0.50%), Comisión Venta (0%), Agente (2%)
- **Anexo 6 (admin_fixed, flat, USD):** TCG Finanzas ($500)

**Migration 5: Reference Code Generator**

```sql
CREATE OR REPLACE FUNCTION generate_reference_code()
RETURNS TEXT AS $$
  -- Returns 'MIG-YYYY-NNN'
$$;
```

**Generate types:** `npx supabase gen types typescript > src/types/database.ts`

---

### Phase 3: P&L Engine (Pure TypeScript)

**Files:** `src/lib/engine/types.ts`, `pnl.ts`, `pnl.test.ts`, `helpers.ts`

**Critical calculation flow:**

```
1. total_kilos_purchased = quantity_qq × bag_weight_kg
2. total_purchase_gtq = quantity_qq × price_per_qq_gtq
3. total_purchase_usd = total_purchase_gtq / exchange_rate
4. total_kilos_sold = SUM(all allocation kilos)
5. merma_kg = total_kilos_purchased × merma_pct
6. diferencia_merma = total_kilos_purchased - total_kilos_sold - merma_kg

7. revenue_usd = SUM(kilos × sale_price_usd_kg) per grade
8. revenue_gtq = revenue_usd × exchange_rate
9. gross_margin = revenue_usd - total_purchase_usd

Operating costs by category:
10. purchasing:      amount_gtq × quantity_qq → convert to USD
11. maquila:         amount_gtq × quantity_qq → convert to USD
12. export_fixed_20: amount_gtq × count_20ft → convert to USD
13. export_var_20:   amount_gtq × kilos_in_20ft_containers → convert to USD
14. export_fixed_40: amount_gtq × count_40ft → convert to USD
15. export_var_40:   amount_gtq × kilos_in_40ft_containers → convert to USD
16. invoice_variable: pct × revenue_usd (already USD)

17. total_operating_costs_usd = SUM(all above)
18. EBIT = gross_margin - total_operating_costs

*** FINANCIAL COST (base includes admin_fixed):
19. financial_base_gtq = purchase_gtq + operating_costs_gtq + (admin_fixed_usd × exchange_rate)
20. financial_cost_gtq = financial_base_gtq × (annual_rate × months / 12)
21. financial_cost_usd = financial_cost_gtq / exchange_rate

22. EBT = EBIT - financial_cost_usd - admin_fixed_usd
23. ISR = max(0, EBT × isr_pct)
24. NET_INCOME = EBT - ISR
25. All GTQ equivalents = usd_value × exchange_rate
```

**P&L display order:**
```
Ingresos (Revenue)
(Costo de compra)
─── Margen bruto ───
  (Costos operativos) [expandable by Anexo]
─── EBIT ───
  (Costo financiero)
  (Admin fijo)
─── Utilidad antes de ISR (EBT) ───
  (ISR 25%)
═══ UTILIDAD NETA ═══
Footer: Total kilos · $/kg · Merma kg
```

**Unit test reference values (Verdes sheet scenario):**
- Input: 233 qq, Q8,000/qq, 46 kg bag, TC 7.75, merma 3%, rate 9.75%, 1.5 mo, ISR 25%, admin $500
- 1 × 20ft container: P1 2600kg@$33, P2 1800@$38.50, P3 1600@$36, S1 1000@$38, S2 1000@$32.75, GOP 900@$29.25, TRIP 1500@$28
- Expected: Revenue $351,775 | Purchase $240,516.13 | Gross margin $111,258.87

---

### Phase 4: Auth Setup

- `/login` page — email/password, Spanish labels ("Iniciar sesión", "Correo electrónico", "Contraseña")
- Server action for login with `signInWithPassword()`
- `getUser()` helper — fetches user + role
- `requireRole()` guard — redirects if insufficient role
- Middleware: unauth → `/login`, `/admin/*` requires `master`
- User nav: name, role badge, "Cerrar sesión"

---

### Phase 5: Zustand Store + Data Layer

**`src/stores/shipment-store.ts`:**
```typescript
interface ShipmentState {
  purchase: PurchaseData;
  containers: ContainerData[];
  costs: CostLineData[];
  params: FinancialParams;
  pnl: PnlResult;  // derived, recomputed after every mutation

  // Actions
  setPurchase(field, value): void;
  setAllocation(containerId, gradeId, field, value): void;
  addContainer(size): void;
  removeContainer(containerId): void;
  setParam(field, value): void;
  loadFromDatabase(data): void;
}
```

Custom middleware calls `calculatePnl()` after every state mutation → `pnl` always current.

**Auto-save:** `useEffect` watches store, debounced 500ms → upsert to Supabase. Shows "Guardado" / "Guardando..." / "Error al guardar".

**Data access (`src/lib/supabase/queries/`):**
- `shipments.ts` — getShipments, getShipmentFull (with nested containers/allocations/costs), upsertShipment
- `costs.ts` — getCostItemsWithLatestPrices, addCostPrice, getCostHistory
- `quality-grades.ts` — CRUD

---

### Phase 6: Shipment Workspace (THE Main Screen — 90% of user time)

**Layout (matches HTML mockup):**

```
┌─────────────────────────────────────────────────────────┐
│  MIG-2024-003 · Borrador                    [Costos] [⚙]│
├────────────────────┬────────────────────────────────────┤
│  COMPRA            │  CONTENEDOR 1 — 20'                │
│  ───────────       │  ──────────                        │
│  233 qq            │  [Quality allocation table]         │
│  Q 8,000/qq        │  [Capacity bar]                    │
│  46 kg/saco        │  [+ Agregar contenedor]            │
│  TC: 7.75          │                                    │
│  ───────────       │                                    │
│  Total kg: 10,718  │                                    │
│  Total Q: 1,864,000│                                    │
│  Total $: 240,516  │                                    │
│  ───────────       │                                    │
│  PARÁMETROS        │                                    │
│  Merma: 3%         │                                    │
│  Interés: 9.75%    │                                    │
│  Meses: 1.5        │                                    │
│  ISR: 25%          │                                    │
├────────────────────┴────────────────────────────────────┤
│  ESTADO DE RESULTADOS                                    │
│  [KPI cards: Ingresos, Margen bruto, Utilidad neta, %]  │
│  [Detailed P&L table with GTQ + USD columns]            │
└─────────────────────────────────────────────────────────┘
```

**Components:**

| File | Purpose |
|---|---|
| `src/components/embarque/workspace.tsx` | Main orchestrator, initializes store from server data |
| `src/components/embarque/purchase-panel.tsx` | Left sidebar: purchase inputs + params |
| `src/components/embarque/container-panel.tsx` | Container cards with allocation tables |
| `src/components/embarque/allocation-table.tsx` | 10 quality grades, kg/% toggle, $/kg, revenue |
| `src/components/embarque/capacity-bar.tsx` | Visual fill: green (<90%), yellow (90-100%), red (>100%) |
| `src/components/embarque/pnl-summary.tsx` | KPI cards + detailed P&L table |
| `src/components/embarque/costs-detail-dialog.tsx` | Anexo breakdown, per-shipment overrides |
| `src/components/embarque/financial-params-dialog.tsx` | Interest, months, ISR, admin fixed |
| `src/components/embarque/shipment-header.tsx` | Reference code, status badge, action buttons |
| `src/components/embarque/save-indicator.tsx` | Auto-save status display |

**Allocation table tier grouping:**
- Top (P1, P2, P3): subtle green background tint
- Medium (S1, S2): subtle blue background tint
- Low (GOP, YELLOW, MYQ, TRIP, ORO): neutral background

**Role behavior:**
- `gerencia`: all inputs disabled, view-only
- `operator`: full editing
- `master`: full editing + admin access

---

### Phase 7: Admin Screens (master only)

- **`/admin/costos`** — Cost management: accordion panels by Anexo, each item shows current price + expandable history, "Registrar nuevo precio" dialog (append-only), Admin fixed ($500) management modal for setting new default
- **`/admin/calidades`** — Quality grades: table with code, name, tier, sort order, active toggle. Add new grades, reorder, soft-delete via is_active

---

### Phase 8: Clone Flow

- "Nuevo embarque" button → clone dialog
- Select source shipment (most recent complete first) or "Embarque en blanco"
- Deep clone: purchase params, containers, allocations, snapshot current cost prices
- Auto-generate reference code `MIG-YYYY-NNN`
- Navigate to new workspace in `draft` status

**`src/lib/utils/clone.ts`:**
```typescript
async function cloneShipment(sourceId: string | null, userId: string): Promise<string>
```

---

### Phase 9: Polish

- Global layout + header: "MIG Export" branding, nav (Embarques, Admin), user menu
- Spanish labels centralized in `src/lib/constants/labels.ts`
- Currency formatting: `formatUSD()`, `formatGTQ()`, `formatPct()`, `formatNumber()`
- Zod validation schemas for all inputs
- Error boundary + 404 in Spanish
- Responsive adjustments

---

## Build Order

| Phase | Depends on | Result |
|---|---|---|
| 1. Scaffold | — | Bootable app |
| 2. Database | 1 | Schema + generated types |
| 3. P&L Engine | — | Core logic + passing tests |
| 4. Auth | 1, 2 | Login + role enforcement |
| 5. Store + Data | 2, 3 | State management wired |
| 6. Workspace | 3, 4, 5 | Main screen end-to-end |
| 7. Admin | 2, 4 | Cost/grade management |
| 8. Clone | 6, 7 | New shipment workflow |
| 9. Polish | all | Production-ready |

Phases 3 and 4 can run in parallel (no mutual dependencies).

---

## Verification Plan

1. **P&L Engine:** `vitest run` — unit tests match Excel reference values
2. **Auth:** Login as each role → verify route access and UI restrictions
3. **Workspace:** Enter the Excel scenario values → verify P&L output matches
4. **Auto-save:** Edit → wait → refresh → data persists
5. **Clone:** Clone a shipment → verify all data copied, new reference code generated
6. **Admin costs:** Add new price → verify it appears in next shipment's cost snapshot
7. **Gerencia role:** Log in as gerencia → verify all inputs disabled, all data visible

---

## Key Risks and Mitigations

| Risk | Mitigation |
|---|---|
| P&L numbers don't match Excel | Unit test uses exact Excel values. Note: app will produce slightly different Anexo 5 values than Excel because Excel has cross-sheet reference bug |
| Auto-save race conditions | 500ms debounce, optimistic updates, error toast without losing local state |
| Cost snapshot drift | Each shipment snapshots costs at creation → self-contained, correct behavior |
| kg/% conversion precision | Kilos is canonical value. Percentage is always derived. Store kilos immediately on % input |
| Financial cost circular dependency | Not circular: admin_fixed is a known input, not derived. Compute financial_base including admin, then subtract admin from EBIT |
