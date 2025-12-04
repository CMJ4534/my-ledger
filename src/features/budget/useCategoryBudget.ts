// src/features/budget/useCategoryBudget.ts
import { useEffect, useState } from "react";

const KEY = "category_budget_v1";

// 구조: { [month: string]: { [categoryName: string]: number } }
type MonthCategoryBudget = Record<string, Record<string, number>>;

function loadAll(): MonthCategoryBudget {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as MonthCategoryBudget;
  } catch {
    return {};
  }
}

function saveAll(all: MonthCategoryBudget) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(all));
}

/**
 * month: "YYYY-MM" 기준으로
 * 카테고리별 예산을 관리하는 훅
 */
export function useCategoryBudget(month: string) {
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    {}
  );

  // month 바뀔 때마다 해당 월 카테고리 예산 불러오기
  useEffect(() => {
    const all = loadAll();
    setCategoryBudgets(all[month] ?? {});
  }, [month]);

  function setCategoryBudget(category: string, value: number) {
    const trimmed = category.trim();
    if (!trimmed) return;

    const all = loadAll();
    const current = { ...(all[month] ?? {}) };

    if (!Number.isFinite(value) || value <= 0) {
      // 0 이하 & NaN이면 예산 삭제
      delete current[trimmed];
    } else {
      current[trimmed] = value;
    }

    const nextAll: MonthCategoryBudget = { ...all };
    if (Object.keys(current).length === 0) {
      delete nextAll[month];
    } else {
      nextAll[month] = current;
    }

    saveAll(nextAll);
    setCategoryBudgets(current);
  }

  return { categoryBudgets, setCategoryBudget };
}
