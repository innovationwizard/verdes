# 2026-04-07 — Gastos fijos extraordinarios por embarque

## Funcionalidad nueva

Se agregó la capacidad de añadir gastos fijos de exportación extraordinarios a nivel de embarque, tanto para contenedores de 20' como de 40'.

### Cómo funciona

En el diálogo de costos, las secciones "Gastos expo. fijos 20'" y "Gastos expo. fijos 40'" ahora muestran un botón **"Agregar otro"** al final de la lista de conceptos.

Al hacer clic:
- Se crea una fila nueva con campo de **Concepto** editable (texto libre) y campo de **Monto** editable (Q)
- Un botón **X** permite eliminar la fila
- El P&L se recalcula inmediatamente al agregar, editar o eliminar un gasto extraordinario

### Alcance

- Los gastos extraordinarios aplican **solo al embarque actual**
- No se guardan en la tabla `cost_items` (no se convierten en valores predeterminados)
- No se propagan al clonar un embarque — cada embarque nuevo parte de los costos estándar
- Se identifican internamente con el prefijo `Extra:` en el nombre

### Ejemplo de uso

El usuario necesita registrar un gasto no recurrente como un flete especial, un seguro adicional o un cargo portuario extraordinario que solo aplica a este embarque en particular.

## Cambios técnicos

- **`shipment-store.ts`**: nuevas acciones `addExtraCost(category)`, `removeExtraCost(name, category)`, `renameExtraCost(oldName, category, newName)`
- **`costs-detail-dialog.tsx`**: botón "Agregar otro" en categorías de exportación fija, filas editables para gastos extraordinarios con opción de eliminar
- El motor P&L no requirió cambios — los gastos extraordinarios entran como `CostLineInput` con `unit: "flat"` igual que los demás gastos fijos
