// 예: src/features/transactions/TransactionForm.tsx

import { useState } from "react";
import { useTransactions } from "./useTransactions";
import { useCategories } from "../categories/useCategories";
import type { CategoryType } from "../../lib/categories";

type FormState = {
  date: string;
  type: CategoryType;   // "INCOME" | "EXPENSE"
  categoryId: string;   // 카테고리 id 저장
  memo: string;
  amount: string;
};

export default function TransactionForm() {
  const { add } = useTransactions();
  const { getByType, addCategory } = useCategories();

  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().slice(0, 10),
    type: "EXPENSE",
    categoryId: "",
    memo: "",
    amount: "",
  });

  const categories = getByType(form.type);

  function handleCategoryChange(value: string) {
    if (value === "__ADD__") {
      const name = window.prompt("새 카테고리 이름을 입력하세요");
      if (name) {
        addCategory(form.type, name);
      }
      return;
    }
    setForm(f => ({ ...f, categoryId: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amt = Number((form.amount ?? "").trim());
    if (!Number.isFinite(amt)) return;

    await add({
      date: form.date,
      type: form.type,
      // 저장은 이름으로 해도 되고 id로 해도 됨.
      // 지금 구조 유지하려면 name을 저장하자:
      category: categories.find(c => c.id === form.categoryId)?.name,
      memo: form.memo.trim() || undefined,
      amount: amt,
    });

    setForm(f => ({ ...f, memo: "", amount: "" }));
  }

  return (
    <form onSubmit={onSubmit}>
      {/* 날짜 */}
      <input
        type="date"
        value={form.date}
        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
      />

      {/* 타입 (지출/수입) */}
      <select
        value={form.type}
        onChange={e =>
          setForm(f => ({
            ...f,
            type: e.target.value as CategoryType,
            categoryId: "", // 타입 바뀌면 카테고리 선택 초기화
          }))
        }
      >
        <option value="EXPENSE">지출</option>
        <option value="INCOME">수입</option>
      </select>

      {/* 카테고리 (타입에 따라 리스트가 다름) */}
      <select
        value={form.categoryId}
        onChange={e => handleCategoryChange(e.target.value)}
      >
        <option value="">카테고리 선택</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
        <option value="__ADD__">+ 새 카테고리 추가...</option>
      </select>

      {/* 메모 / 금액 등 나머지 필드... */}
      <input
        placeholder="메모"
        value={form.memo}
        onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
      />
      <input
        placeholder="금액"
        value={form.amount}
        onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
      />
      <button type="submit">추가</button>
    </form>
  );
}
