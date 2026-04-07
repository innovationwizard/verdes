"use client";

import { create } from "zustand";
import { calculatePnl } from "@/lib/engine/pnl";
import type { PnlInput, PnlResult, CostLineInput } from "@/lib/engine/types";

export interface QualityGradeInfo {
  id: string;
  code: string;
  display_name: string;
  tier: "top" | "medium" | "low";
  sort_order: number;
}

export interface AllocationData {
  quality_grade_id: string;
  quality_grade_code: string;
  kilos: number;
  percentage: number | null;
  sale_price_usd_kg: number;
}

export interface ContainerData {
  id: string;
  size: "20ft" | "40ft";
  sequence_number: number;
  capacity_kg: number;
  allocations: AllocationData[];
  input_mode: "kilos" | "percentage";
}

export interface PurchaseData {
  quantity_qq: number;
  price_per_qq_gtq: number;
  bag_weight_kg: number;
  exchange_rate: number;
}

export interface FinancialParams {
  merma_pct: number;
  interest_rate_annual: number;
  financing_months: number;
  isr_pct: number;
  admin_fixed_usd: number;
}

export interface ShipmentMeta {
  id: string;
  reference_code: string;
  status: "draft" | "in_progress" | "complete" | "cancelled";
  date: string;
  label: string | null;
}

interface ShipmentState {
  meta: ShipmentMeta;
  purchase: PurchaseData;
  containers: ContainerData[];
  costs: CostLineInput[];
  params: FinancialParams;
  qualityGrades: QualityGradeInfo[];
  pnl: PnlResult;
  isDirty: boolean;

  // Actions
  setPurchase: (field: keyof PurchaseData, value: number) => void;
  setParam: (field: keyof FinancialParams, value: number) => void;
  setAllocation: (
    containerId: string,
    gradeCode: string,
    field: "kilos" | "sale_price_usd_kg",
    value: number
  ) => void;
  setContainerInputMode: (
    containerId: string,
    mode: "kilos" | "percentage"
  ) => void;
  setAllocationPercentage: (
    containerId: string,
    gradeCode: string,
    pct: number
  ) => void;
  addContainer: (size: "20ft" | "40ft") => void;
  removeContainer: (containerId: string) => void;
  setStatus: (status: ShipmentMeta["status"]) => void;
  setCostOverride: (
    costName: string,
    category: string,
    amount: number
  ) => void;
  loadShipment: (data: {
    meta: ShipmentMeta;
    purchase: PurchaseData;
    containers: ContainerData[];
    costs: CostLineInput[];
    params: FinancialParams;
    qualityGrades: QualityGradeInfo[];
  }) => void;
  markClean: () => void;
}

function buildPnlInput(state: {
  purchase: PurchaseData;
  containers: ContainerData[];
  costs: CostLineInput[];
  params: FinancialParams;
}): PnlInput {
  return {
    purchase: state.purchase,
    containers: state.containers.map((c) => ({
      size: c.size,
      allocations: c.allocations
        .filter((a) => a.kilos > 0)
        .map((a) => ({
          quality_grade_code: a.quality_grade_code,
          kilos: a.kilos,
          sale_price_usd_kg: a.sale_price_usd_kg,
        })),
    })),
    costs: state.costs,
    params: state.params,
  };
}

const DEFAULT_PURCHASE: PurchaseData = {
  quantity_qq: 233,
  price_per_qq_gtq: 8000,
  bag_weight_kg: 46,
  exchange_rate: 7.75,
};

const DEFAULT_PARAMS: FinancialParams = {
  merma_pct: 0.03,
  interest_rate_annual: 0.0975,
  financing_months: 1.5,
  isr_pct: 0.25,
  admin_fixed_usd: 500,
};

const EMPTY_PNL = calculatePnl({
  purchase: DEFAULT_PURCHASE,
  containers: [],
  costs: [],
  params: DEFAULT_PARAMS,
});

export const useShipmentStore = create<ShipmentState>((set) => ({
  meta: {
    id: "",
    reference_code: "",
    status: "draft",
    date: new Date().toISOString().split("T")[0],
    label: null,
  },
  purchase: DEFAULT_PURCHASE,
  containers: [],
  costs: [],
  params: DEFAULT_PARAMS,
  qualityGrades: [],
  pnl: EMPTY_PNL,
  isDirty: false,

  setPurchase: (field, value) => {
    set((state) => {
      const newPurchase = { ...state.purchase, [field]: value };
      const newState = { ...state, purchase: newPurchase, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  setParam: (field, value) => {
    set((state) => {
      const newParams = { ...state.params, [field]: value };
      const newState = { ...state, params: newParams, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  setAllocation: (containerId, gradeCode, field, value) => {
    set((state) => {
      const newContainers = state.containers.map((c) => {
        if (c.id !== containerId) return c;
        return {
          ...c,
          allocations: c.allocations.map((a) => {
            if (a.quality_grade_code !== gradeCode) return a;
            const updated = { ...a, [field]: value };
            if (field === "kilos") {
              updated.percentage =
                c.capacity_kg > 0 ? value / c.capacity_kg : null;
            }
            return updated;
          }),
        };
      });
      const newState = { ...state, containers: newContainers, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  setAllocationPercentage: (containerId, gradeCode, pct) => {
    set((state) => {
      const newContainers = state.containers.map((c) => {
        if (c.id !== containerId) return c;
        return {
          ...c,
          allocations: c.allocations.map((a) => {
            if (a.quality_grade_code !== gradeCode) return a;
            return {
              ...a,
              percentage: pct,
              kilos: c.capacity_kg * pct,
            };
          }),
        };
      });
      const newState = { ...state, containers: newContainers, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  setContainerInputMode: (containerId, mode) => {
    set((state) => {
      const newContainers = state.containers.map((c) => {
        if (c.id !== containerId) return c;
        return { ...c, input_mode: mode };
      });
      return { containers: newContainers };
    });
  },

  addContainer: (size) => {
    set((state) => {
      const maxSeq = state.containers.reduce(
        (max, c) => Math.max(max, c.sequence_number),
        0
      );
      const capacity = size === "20ft" ? 10000 : 23000;
      const newContainer: ContainerData = {
        id: `temp-${Date.now()}`,
        size,
        sequence_number: maxSeq + 1,
        capacity_kg: capacity,
        input_mode: "kilos",
        allocations: state.qualityGrades.map((g) => ({
          quality_grade_id: g.id,
          quality_grade_code: g.code,
          kilos: 0,
          percentage: null,
          sale_price_usd_kg: 0,
        })),
      };
      const newContainers = [...state.containers, newContainer];
      const newState = { ...state, containers: newContainers, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  removeContainer: (containerId) => {
    set((state) => {
      const newContainers = state.containers.filter(
        (c) => c.id !== containerId
      );
      const newState = { ...state, containers: newContainers, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  setStatus: (status) => {
    set((state) => ({
      meta: { ...state.meta, status },
      isDirty: true,
    }));
  },

  setCostOverride: (costName, category, amount) => {
    set((state) => {
      const newCosts = state.costs.map((c) =>
        c.name === costName && c.category === category
          ? { ...c, amount }
          : c
      );
      const newState = { ...state, costs: newCosts, isDirty: true };
      return { ...newState, pnl: calculatePnl(buildPnlInput(newState)) };
    });
  },

  loadShipment: (data) => {
    const pnlInput = buildPnlInput(data);
    set({
      ...data,
      pnl: calculatePnl(pnlInput),
      isDirty: false,
    });
  },

  markClean: () => {
    set({ isDirty: false });
  },
}));
