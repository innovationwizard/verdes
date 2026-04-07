import { describe, it, expect } from "vitest";
import { calculatePnl } from "./pnl";
import type { PnlInput } from "./types";

/**
 * Reference scenario from the "Verdes" Excel sheet.
 * 233 qq × Q8,000/qq, 46 kg bags, TC 7.75
 * 1 × 20ft container with 7 quality grades allocated.
 *
 * Cost values from Anexos in the Excel:
 * - Anexo 1: all zero
 * - Anexo 2: Maquila Q170/qq
 * - Anexo 3 fixed: Q47,612.3575 total (flat per 20ft container)
 * - Anexo 3 variable: Q16,324.19 total (per kg × 10,000 kg capacity)
 * - Anexo 4: zero (no 40ft containers)
 * - Anexo 5: 2.9% of revenue (Seguro 0.25% + BAM 0.15% + BAM Cobranza 0.5% + Agente 2%)
 * - Anexo 6: $500 admin fixed
 */

const VERDES_COSTS = [
  // Anexo 1 - purchasing (all zero)
  { category: "purchasing" as const, name: "Flete Interno", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Carga/Descarga", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Costo seguro", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Patrulla custodio", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Sacos", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Bolsa", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },
  { category: "purchasing" as const, name: "Comisión Compra", amount: 0, currency: "GTQ" as const, unit: "per_qq" as const },

  // Anexo 2 - maquila
  { category: "maquila" as const, name: "Maquila", amount: 170, currency: "GTQ" as const, unit: "per_qq" as const },

  // Anexo 3 fixed - export fixed 20ft (individual items, flat per container)
  { category: "export_fixed_20" as const, name: "Banco Industrial", amount: 271.25, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Banco BAM SWIFT", amount: 155, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Certificado de Origen", amount: 123.3025, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Fitosanitario", amount: 49.6775, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Fumigación", amount: 1309.285, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Certificado Peso/Calidad", amount: 1743.75, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Agente Aduanal", amount: 591.8675, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "DHL muestra", amount: 1162.50, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Deprex", amount: 99.975, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Logística", amount: 3875, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Custodio puerto", amount: 643.25, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "Flete Puerto", amount: 10075, currency: "GTQ" as const, unit: "flat" as const },
  { category: "export_fixed_20" as const, name: "MSC Naviera", amount: 27512.50, currency: "GTQ" as const, unit: "flat" as const },

  // Anexo 3 variable - export var 20ft (per kg, applied to container capacity)
  { category: "export_var_20" as const, name: "Cajas Master", amount: 0.5559075, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Caja Inner", amount: 0.80050525, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Fleje", amount: 0.0266462704, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Grapa Fleje", amount: 0.0023183761, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Grapa caja", amount: 0.0439588190, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Bolsas negras", amount: 0.1262707500, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Stickers", amount: 0, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Sellos 5kg", amount: 0.0207094003, currency: "GTQ" as const, unit: "per_kg" as const },
  { category: "export_var_20" as const, name: "Sellos 40kg", amount: 0.0561022197, currency: "GTQ" as const, unit: "per_kg" as const },

  // Anexo 5 - invoice variable (percentage of revenue)
  { category: "invoice_variable" as const, name: "Seguro de Carga", amount: 0.0025, currency: "USD" as const, unit: "pct_invoice" as const },
  { category: "invoice_variable" as const, name: "Banco BAM", amount: 0.0015, currency: "USD" as const, unit: "pct_invoice" as const },
  { category: "invoice_variable" as const, name: "BAM Cobranza", amount: 0.005, currency: "USD" as const, unit: "pct_invoice" as const },
  { category: "invoice_variable" as const, name: "Comisión Venta", amount: 0, currency: "USD" as const, unit: "pct_invoice" as const },
  { category: "invoice_variable" as const, name: "Agente", amount: 0.02, currency: "USD" as const, unit: "pct_invoice" as const },
];

const VERDES_INPUT: PnlInput = {
  purchase: {
    quantity_qq: 233,
    price_per_qq_gtq: 8000,
    bag_weight_kg: 46,
    exchange_rate: 7.75,
  },
  containers: [
    {
      size: "20ft",
      allocations: [
        { quality_grade_code: "P1", kilos: 2600, sale_price_usd_kg: 33 },
        { quality_grade_code: "P2", kilos: 1800, sale_price_usd_kg: 38.5 },
        { quality_grade_code: "P3", kilos: 1600, sale_price_usd_kg: 36 },
        { quality_grade_code: "S1_7MM", kilos: 1000, sale_price_usd_kg: 38 },
        { quality_grade_code: "S2_5_6MM", kilos: 1000, sale_price_usd_kg: 32.75 },
        { quality_grade_code: "GOP", kilos: 900, sale_price_usd_kg: 29.25 },
        { quality_grade_code: "TRIP", kilos: 1500, sale_price_usd_kg: 28 },
      ],
    },
  ],
  costs: VERDES_COSTS,
  params: {
    merma_pct: 0.03,
    interest_rate_annual: 0.0975,
    financing_months: 1.5,
    isr_pct: 0.25,
    admin_fixed_usd: 500,
  },
};

describe("calculatePnl", () => {
  const result = calculatePnl(VERDES_INPUT);

  it("calculates purchase totals correctly", () => {
    expect(result.total_kilos_purchased).toBe(10718); // 233 × 46
    expect(result.total_purchase_gtq).toBe(1864000); // 233 × 8000
    expect(result.total_purchase_usd).toBeCloseTo(240516.13, 2); // 1864000 / 7.75
  });

  it("calculates allocation totals correctly", () => {
    expect(result.total_kilos_sold).toBe(10400);
    expect(result.merma_kg).toBeCloseTo(321.54, 2); // 10718 × 0.03
    expect(result.diferencia_merma_kg).toBeCloseTo(-3.54, 2); // 10718 - 10400 - 321.54
  });

  it("calculates revenue correctly", () => {
    // P1: 2600×33 = 85800
    // P2: 1800×38.5 = 69300
    // P3: 1600×36 = 57600
    // S1: 1000×38 = 38000
    // S2: 1000×32.75 = 32750
    // GOP: 900×29.25 = 26325
    // TRIP: 1500×28 = 42000
    // Total: 351775
    expect(result.total_revenue_usd).toBe(351775);
    expect(result.total_revenue_gtq).toBeCloseTo(2726256.25, 2);
  });

  it("calculates gross margin correctly", () => {
    expect(result.gross_margin_usd).toBeCloseTo(111258.87, 2);
    expect(result.gross_margin_pct).toBeCloseTo(0.3163, 3);
  });

  it("calculates operating costs correctly", () => {
    // Anexo 1: $0
    // Anexo 2: 233 × Q170 = Q39,610 → $5,110.97
    // Anexo 3 fixed: Q47,612.3575 → $6,143.53
    // Anexo 3 var: Q16,324.19 → $2,106.35
    // Anexo 5: 2.9% × $351,775 = $10,201.48 (app computes against own revenue)
    //
    // Note: The Excel uses $340,094.20 for Anexo 5 (cross-sheet reference bug).
    // The app correctly uses $351,775 (this shipment's revenue).
    // Anexo 5: 0.029 × $351,775 = $10,201.48 (vs Excel's $9,862.73)
    // Total: $5,110.97 + $6,143.53 + $2,106.35 + $10,201.48 = $23,562.32
    expect(result.total_operating_costs_usd).toBeCloseTo(23562.32, 0);
  });

  it("calculates EBIT correctly", () => {
    // EBIT = gross_margin - operating_costs
    const expectedEbit = result.gross_margin_usd - result.total_operating_costs_usd;
    expect(result.ebit_usd).toBeCloseTo(expectedEbit, 2);
  });

  it("calculates financial cost correctly", () => {
    // financial_base_gtq = purchase + operating + admin_fixed (all in GTQ)
    const expectedBase =
      result.total_purchase_gtq +
      result.total_operating_costs_gtq +
      result.admin_fixed_gtq;
    const expectedFinancial = expectedBase * ((0.0975 * 1.5) / 12);
    expect(result.financial_cost_gtq).toBeCloseTo(expectedFinancial, 2);
  });

  it("calculates EBT correctly", () => {
    expect(result.ebt_usd).toBeCloseTo(
      result.ebit_usd - result.financial_cost_usd - result.admin_fixed_usd,
      2
    );
  });

  it("calculates ISR only when EBT is positive", () => {
    expect(result.isr_usd).toBeCloseTo(result.ebt_usd * 0.25, 2);
    expect(result.isr_usd).toBeGreaterThan(0);
  });

  it("calculates net income correctly", () => {
    expect(result.net_income_usd).toBeCloseTo(
      result.ebt_usd - result.isr_usd,
      2
    );
  });

  it("calculates per-kg metrics", () => {
    expect(result.net_income_per_kg_usd).toBeCloseTo(
      result.net_income_usd / 10400,
      4
    );
  });

  it("returns container summaries", () => {
    expect(result.containers).toHaveLength(1);
    expect(result.containers[0].size).toBe("20ft");
    expect(result.containers[0].total_kilos).toBe(10400);
    expect(result.containers[0].capacity_kg).toBe(10000);
  });
});

describe("calculatePnl edge cases", () => {
  it("handles zero allocations", () => {
    const input: PnlInput = {
      ...VERDES_INPUT,
      containers: [{ size: "20ft", allocations: [] }],
    };
    const result = calculatePnl(input);
    expect(result.total_revenue_usd).toBe(0);
    expect(result.total_kilos_sold).toBe(0);
    expect(result.isr_usd).toBe(0); // EBT will be negative
  });

  it("handles negative EBT (ISR should be 0)", () => {
    const input: PnlInput = {
      ...VERDES_INPUT,
      purchase: {
        ...VERDES_INPUT.purchase,
        price_per_qq_gtq: 50000, // Very high purchase price
      },
    };
    const result = calculatePnl(input);
    expect(result.ebt_usd).toBeLessThan(0);
    expect(result.isr_usd).toBe(0);
  });

  it("handles empty containers array", () => {
    const input: PnlInput = {
      ...VERDES_INPUT,
      containers: [],
    };
    const result = calculatePnl(input);
    expect(result.total_revenue_usd).toBe(0);
    expect(result.containers).toHaveLength(0);
  });

  it("handles 40ft container", () => {
    const input: PnlInput = {
      ...VERDES_INPUT,
      containers: [
        {
          size: "40ft",
          allocations: [
            { quality_grade_code: "P1", kilos: 10000, sale_price_usd_kg: 33 },
          ],
        },
      ],
    };
    const result = calculatePnl(input);
    expect(result.containers[0].capacity_kg).toBe(23000);
    expect(result.total_revenue_usd).toBe(330000);
  });
});
