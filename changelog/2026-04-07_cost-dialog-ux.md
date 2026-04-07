# 2026-04-07 — UX de costos en diálogo de detalle

## Gastos de exportación variables (Anexo 3/4 variable)

**Antes:** El usuario veía y editaba valores por kg (ej: `0.5559 /kg`), lo cual no corresponde a cómo maneja los datos en la práctica.

**Ahora:** El usuario ingresa el monto total en Q por contenedor (ej: `Q 5,559` para Cajas Master). La aplicación convierte internamente a tasa por kg dividiendo entre la capacidad del contenedor (10,000 kg para 20', 23,000 kg para 40').

- Columna "Total Q": campo editable con el monto total en quetzales
- Columna "Q/kg": muestra la tasa por kg calculada (solo lectura, referencia)
- Texto guía: "Ingrese el monto total en Q por contenedor"
- Total del acordeón: muestra la suma de montos totales, no de tasas

## Costo variable sobre factura (Anexo 5)

**Antes:** El usuario veía y editaba valores decimales crudos (ej: `0.02` para Agente 2%), sin ver el impacto en quetzales.

**Ahora:** Tabla dedicada con dos columnas:

| Columna | Tipo | Ejemplo |
|---|---|---|
| % | Editable | `2.00` (el usuario escribe el porcentaje) |
| Monto Q | Calculado | `Q 54,525.13` (= 2% × ingresos totales GTQ) |

- Los porcentajes se editan directamente como números enteros/decimales (ej: `0.25` para 0.25%)
- El monto en Q se calcula en tiempo real multiplicando el porcentaje por los ingresos totales en GTQ
- Fila de totales muestra el porcentaje acumulado y el monto total en Q
- El total del acordeón ahora muestra el monto total en Q en lugar de la suma de decimales

## Impacto técnico

- El motor P&L no se modificó — sigue recibiendo y procesando tasas decimales (0.02 para 2%)
- Toda la conversión ocurre en la capa de presentación (`costs-detail-dialog.tsx`)
- Los valores almacenados en `shipment_costs` no cambian de formato
