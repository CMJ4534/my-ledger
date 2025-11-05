import { useState } from "react";
import type { Transaction } from "./types";

type FormState = {
  date: string;
  type: "EXPENSE" | "INCOME";
  category: string;
  memo: string;
  amount: string;
};

// ✅ add를 props로 받는다 (훅 호출 금지)
type Props = {
  onAdd: (tx: Omit<Transaction, "id">) => Promise<void> | void;
};

export default function TransactionForm({ onAdd }: Props) {
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().slice(0, 10),
    type: "EXPENSE",
    category: "",
    memo: "",
    amount: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number((form.amount ?? "").trim());
    if (!Number.isFinite(amt)) return;

    await onAdd({
      date: form.date,
      type: form.type,
      category: form.category.trim() || undefined,
      memo: form.memo.trim() || undefined,
      amount: amt,
    });

    setForm((f) => ({ ...f, category: "", memo: "", amount: "" }));
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        type="date"
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
      />
      <select
        value={form.type}
        onChange={(e) =>
          setForm((f) => ({ ...f, type: e.target.value as "EXPENSE" | "INCOME" }))
        }
      >
        <option value="EXPENSE">지출</option>
        <option value="INCOME">수입</option>
      </select>
      <input
        placeholder="카테고리"
        value={form.category}
        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
      />
      <input
        placeholder="메모"
        value={form.memo}
        onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
      />
      <input
        placeholder="금액"
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
      />
      <button type="submit">추가</button>
    </form>
  );
}
