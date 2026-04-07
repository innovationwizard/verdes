# 2026-04-06 — Construcción inicial de MIG Export

## Resumen

Primera versión funcional de MIG Export, una aplicación web que reemplaza la plantilla Excel (Verdes.xlsx) utilizada para calcular el estado de resultados de exportaciones de cardamomo. La aplicación calcula automáticamente ingresos, costos operativos, costo financiero, ISR y utilidad neta en tiempo real conforme el usuario ingresa datos.

---

## Qué se construyó

### Motor de cálculo P&L (`src/lib/engine/pnl.ts`)

Función pura en TypeScript que recibe los datos del embarque y devuelve el estado de resultados completo. Sin efectos secundarios, ejecuta del lado del cliente para reactividad instantánea.

**Flujo de cálculo:**
- Compra: quintales × precio × peso saco → total GTQ → USD vía tipo de cambio
- Ingresos: suma de (kilos × precio venta USD/kg) por cada calidad asignada
- Margen bruto: ingresos - costo de compra
- Costos operativos: Anexos 1-5 (compra, maquila, exportación fija/variable 20'/40', variable s/factura)
- EBIT: margen bruto - costos operativos
- Costo financiero: (compra + costos operativos + admin fijo) × tasa × meses/12
- Utilidad antes de ISR: EBIT - costo financiero - admin fijo
- ISR: 25% sobre utilidad (solo si positiva)
- Utilidad neta: utilidad antes de ISR - ISR

**Corrección vs Excel:** La aplicación calcula Anexo 5 (costo variable s/factura) usando los ingresos propios de cada embarque. El Excel original tenía una referencia cruzada entre hojas que usaba ingresos de otro escenario, produciendo un error sutil en los costos variables.

**16 pruebas unitarias** verifican el motor contra valores conocidos del Excel, incluyendo casos borde (EBT negativo, contenedores vacíos, contenedor 40').

### Base de datos (Supabase PostgreSQL)

**Tablas creadas:**
- `user_profiles` — Usuarios con roles (master/operator/gerencia)
- `quality_grades` — 10 calidades de cardamomo en 3 tiers (superior, media, baja)
- `cost_items` + `cost_prices` — Estructura de costos con historial append-only
- `shipments` — Embarques con parámetros de compra y financieros
- `shipment_costs` — Snapshot de precios al momento de crear el embarque
- `containers` — Contenedores 20' o 40' por embarque
- `container_allocations` — Kilos y precio por calidad por contenedor

**Datos sembrados:**
- 10 calidades: P1, P2, P3 (superior), S1 +7mm, S2 5-6mm (media), GOP, YELLOW, MYQ, TRIP, ORO (baja)
- Todos los ítems de costo de Anexos 1-6 con precios actuales del Excel
- Función SQL `generate_reference_code()` para códigos MIG-YYYY-NNN

**RLS (Row Level Security):**
- Todos los usuarios autenticados pueden leer todo
- master + operator pueden escribir embarques, contenedores, asignaciones
- Solo master puede modificar costos, calidades y perfiles de usuario
- gerencia es solo lectura

### Interfaz de usuario

**Stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui, Zustand, Zod

**Pantallas:**

| Ruta | Descripción | Acceso |
|---|---|---|
| `/login` | Inicio de sesión con correo/contraseña | Público |
| `/embarques` | Lista de embarques + botón "Nuevo embarque" | Todos |
| `/embarques/[id]` | Workspace del embarque (pantalla principal) | Todos |
| `/admin/costos` | Administración de costos por Anexo | Solo master |
| `/admin/calidades` | Administración de calidades | Solo master |

**Workspace del embarque — Layout de 3 zonas:**

1. **Panel izquierdo (260px):** Datos de compra (quintales, precio, peso saco, tipo de cambio) + parámetros (merma, interés, meses, ISR). Totales calculados: kg, Q, $.

2. **Área central:** Contenedores con tabla de asignación de calidades. Cada fila muestra calidad, kilos (o %), precio $/kg, ingreso calculado, % del total. Toggle kg/% para modo de entrada. Barra de capacidad con indicador visual (verde/amarillo/rojo). Botón para agregar contenedores 20' o 40'.

3. **Panel inferior:** Estado de resultados con:
   - 4 tarjetas KPI (Ingresos, Margen bruto, Utilidad neta, Margen neto)
   - Tabla detallada con columnas USD y GTQ
   - Costos operativos expandibles por Anexo
   - Métricas por kg y diferencia de merma

**Diálogos:**
- Detalle de costos: muestra todos los Anexos con posibilidad de override por embarque
- Parámetros financieros: merma, interés, meses, ISR, admin fijo
- Nuevo embarque: crear en blanco o clonar desde existente

**Auto-guardado:** Los cambios se guardan automáticamente a Supabase con debounce de 1.5 segundos. Indicador visual: "Guardado" / "Guardando..." / "Error al guardar".

**Flujo de clonación:**
- Seleccionar embarque fuente o crear en blanco
- Deep clone: compra, contenedores, asignaciones
- Snapshot fresco de precios de costos actuales
- Código de referencia auto-generado

### Autenticación y roles

- Login con Supabase Auth (email/password)
- Middleware protege todas las rutas (redirige a `/login` si no autenticado)
- Layout con header: navegación, nombre del usuario, badge de rol, menú con "Cerrar sesión"
- Rutas `/admin/*` requieren rol master
- Tres roles: **master** (desarrollador, acceso total), **operator** (José, lectura/escritura de embarques), **gerencia** (C-level, solo lectura)

---

## Estructura de archivos

```
mig-export/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    — Root layout (lang="es", Inter font)
│   │   ├── page.tsx                      — Redirect a /embarques
│   │   ├── login/page.tsx                — Inicio de sesión
│   │   └── (app)/
│   │       ├── layout.tsx                — Layout autenticado con header
│   │       ├── embarques/
│   │       │   ├── page.tsx              — Lista de embarques
│   │       │   └── [id]/page.tsx         — Workspace del embarque
│   │       └── admin/
│   │           ├── layout.tsx            — Guard de rol master
│   │           ├── costos/page.tsx       — Admin de costos
│   │           └── calidades/page.tsx    — Admin de calidades
│   ├── components/
│   │   ├── embarque/
│   │   │   ├── shipment-workspace.tsx    — Orquestador principal
│   │   │   ├── shipment-header.tsx       — Header con código y estado
│   │   │   ├── shipment-list.tsx         — Lista de embarques
│   │   │   ├── new-shipment-dialog.tsx   — Crear/clonar embarque
│   │   │   ├── purchase-panel.tsx        — Inputs de compra
│   │   │   ├── container-panel.tsx       — Contenedores
│   │   │   ├── allocation-table.tsx      — Tabla de asignación de calidades
│   │   │   ├── capacity-bar.tsx          — Barra de capacidad visual
│   │   │   ├── pnl-summary.tsx           — Estado de resultados
│   │   │   ├── costs-detail-dialog.tsx   — Detalle de costos por Anexo
│   │   │   └── financial-params-dialog.tsx — Parámetros financieros
│   │   ├── costos/
│   │   │   ├── cost-management.tsx       — Admin de costos
│   │   │   └── quality-grade-management.tsx — Admin de calidades
│   │   ├── layout/
│   │   │   └── header.tsx                — Header global
│   │   └── ui/                           — Componentes shadcn/ui
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── types.ts                  — Tipos del motor P&L
│   │   │   ├── pnl.ts                    — Motor de cálculo puro
│   │   │   ├── pnl.test.ts              — 16 pruebas unitarias
│   │   │   └── helpers.ts               — toUsd(), toGtq()
│   │   ├── supabase/
│   │   │   ├── client.ts                — Cliente browser
│   │   │   ├── server.ts                — Cliente server
│   │   │   └── middleware.ts            — Refresh de sesión
│   │   ├── auth/
│   │   │   └── get-user.ts              — getUser(), requireAuth(), requireRole()
│   │   ├── constants/
│   │   │   └── labels.ts                — Textos en español
│   │   └── utils/
│   │       └── currency.ts              — formatUSD(), formatGTQ(), formatPct()
│   ├── stores/
│   │   └── shipment-store.ts            — Estado Zustand del workspace
│   └── types/
│       └── database.ts                  — Tipos generados de Supabase
├── supabase/
│   └── migrations/
│       ├── 20240116000001_enums_and_tables.sql
│       ├── 20240116000002_rls_policies.sql
│       ├── 20240116000003_seed_quality_grades.sql
│       └── 20240116000004_seed_cost_items.sql
└── vitest.config.ts
```

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 15.5.14 |
| Runtime | React | 19 |
| Base de datos | Supabase PostgreSQL | — |
| Autenticación | Supabase Auth | — |
| Estado cliente | Zustand | 5.x |
| UI | shadcn/ui + Tailwind CSS | v4 |
| Validación | Zod | 4.x |
| Testing | Vitest | 4.x |
| Idioma UI | Español latinoamericano | — |

---

## Pendiente para producción

1. **Crear usuarios** en Supabase Auth + `user_profiles` para Jorge (master), José (operator), y cuentas gerencia
2. **Deploy a Vercel** — conectar repositorio y configurar variables de entorno
3. **Pruebas de integración** — verificar flujo completo con datos reales de un embarque pasado
4. **Refinamiento UX** — ajustar según feedback de José después del primer uso real
