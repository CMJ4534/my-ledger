// src/features/budget/useBudget.ts
import { useEffect, useState } from "react";

const KEY = "budget_v1";

type BudgetMap = Record<string, number>;

function loadBudgetMap(): BudgetMap {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as BudgetMap;
  } catch {
    return {};
  }
}

function saveBudgetMap(map: BudgetMap) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

/**
 * month: "YYYY-MM" (예: 2025-12)
 */
export function useBudget(month: string) {
  const [budget, setBudgetState] = useState<number>(0);

  // month 바뀔 때마다 localStorage에서 불러오기
  useEffect(() => {
    const map = loadBudgetMap();
    const value = map[month];
    setBudgetState(typeof value === "number" ? value : 0);
  }, [month]);

  function setBudget(value: number) {
    setBudgetState(value);
    const map = loadBudgetMap();
    if (value <= 0) {
      delete map[month];
    } else {
      map[month] = value;
    }
    saveBudgetMap(map);
  }

  return { budget, setBudget };
}
