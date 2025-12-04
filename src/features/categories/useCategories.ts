// src/features/categories/useCategories.ts
import { useEffect, useState } from "react";
import { Category, CategoryType, DEFAULT_CATEGORIES } from "../../lib/categories";

const STORAGE_KEY = "ledger_categories";

function loadFromStorage(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORIES;
    return parsed;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function saveToStorage(categories: Category[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => loadFromStorage());

  // 변경될 때마다 저장
  useEffect(() => {
    saveToStorage(categories);
  }, [categories]);

  function addCategory(type: CategoryType, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    setCategories(prev => [
      ...prev,
      { id, name: trimmed, type, builtIn: false },
    ]);
  }

  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id || c.builtIn));
    // builtIn === true 인 건 남기고, 유저가 만든 것만 삭제되게 한 로직
  }

  function getByType(type: CategoryType) {
    return categories.filter(c => c.type === type);
  }

  return {
    categories,
    addCategory,
    removeCategory,
    getByType,
  };
}
