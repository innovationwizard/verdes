export const LABELS = {
  // App
  app_name: "MIG Export",
  app_description: "Estado de resultados — Exportación de cardamomo",

  // Navigation
  embarques: "Embarques",
  nuevo_embarque: "Nuevo embarque",
  admin: "Administración",
  costos: "Costos",
  calidades: "Calidades",

  // Purchase
  compra: "Compra",
  quintales: "Quintales",
  peso_saco: "Peso saco (kg)",
  precio_qq: "Precio (Q/qq)",
  tipo_cambio: "Tipo de cambio (Q/$)",
  total_kg: "Total kg",
  total_q: "Total Q",
  total_usd: "Total $",

  // Parameters
  parametros: "Parámetros",
  merma: "Merma",
  interes: "Interés anual",
  meses_financiamiento: "Meses financiamiento",
  isr: "ISR",
  admin_fijo: "Admin fijo",

  // Container
  contenedor: "Contenedor",
  agregar_contenedor: "Agregar contenedor",
  eliminar_contenedor: "Eliminar contenedor",
  capacidad: "Capacidad",
  asignado: "asignado",
  sin_asignar: "sin asignar",

  // Quality
  calidad: "Calidad",
  kilos: "Kilos",
  precio_venta: "$/kg",
  ingreso: "Ingreso $",
  porcentaje: "%",

  // P&L
  estado_resultados: "Estado de resultados",
  ingresos: "Ingresos",
  costo_compra: "Costo de compra",
  margen_bruto: "Margen bruto",
  costos_operativos: "Costos operativos",
  gastos_compra: "Gastos de compra",
  maquila: "Maquila",
  gastos_expo_fijos_20: "Gastos expo. fijos 20'",
  gastos_expo_var_20: "Gastos expo. variables 20'",
  gastos_expo_fijos_40: "Gastos expo. fijos 40'",
  gastos_expo_var_40: "Gastos expo. variables 40'",
  costo_variable_factura: "Costo variable s/factura",
  ebit: "EBIT",
  costo_financiero: "Costo financiero",
  utilidad_antes_admin: "Utilidad antes de admin",
  gastos_fijos: "Gastos fijos",
  utilidad_antes_isr: "Utilidad antes de ISR",
  utilidad_neta: "Utilidad neta",
  margen_neto: "Margen neto",
  total_kilos: "Total kilos",
  diferencia_merma: "Diferencia merma",

  // Shipment status
  borrador: "Borrador",
  en_proceso: "En proceso",
  completo: "Completo",
  cancelado: "Cancelado",

  // Actions
  guardar: "Guardar",
  guardado: "Guardado",
  guardando: "Guardando...",
  error_guardar: "Error al guardar",
  cancelar: "Cancelar",
  eliminar: "Eliminar",
  clonar: "Clonar",
  cerrar_sesion: "Cerrar sesión",
  iniciar_sesion: "Iniciar sesión",
  correo: "Correo electrónico",
  contrasena: "Contraseña",

  // Clone
  clonar_desde: "Clonar desde",
  embarque_en_blanco: "Embarque en blanco",

  // Cost management
  registrar_precio: "Registrar nuevo precio",
  historial_precios: "Historial de precios",
  monto: "Monto",
  moneda: "Moneda",
  unidad: "Unidad",
  notas: "Notas",
  fecha_efectiva: "Fecha efectiva",
  precio_actual: "Precio actual",

  // Roles
  master: "Master",
  operator: "Operador",
  gerencia: "Gerencia",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: LABELS.borrador,
  in_progress: LABELS.en_proceso,
  complete: LABELS.completo,
  cancelled: LABELS.cancelado,
};

export const CATEGORY_LABELS: Record<string, string> = {
  purchasing: LABELS.gastos_compra,
  maquila: LABELS.maquila,
  export_fixed_20: LABELS.gastos_expo_fijos_20,
  export_var_20: LABELS.gastos_expo_var_20,
  export_fixed_40: LABELS.gastos_expo_fijos_40,
  export_var_40: LABELS.gastos_expo_var_40,
  invoice_variable: LABELS.costo_variable_factura,
  admin_fixed: LABELS.gastos_fijos,
};
