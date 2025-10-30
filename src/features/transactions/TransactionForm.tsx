import { useState } from "react";
import { useAddTransaction } from "./useTransactions";

type FormState = {
  date: string;
  type: "EXPENSE" | "INCOME";
  category: string;
  memo: string;
  amount: string;
};

export default function TransactionForm() {
  const m = useAddTransaction(); // ← mutation 훅 (성공 시 목록 invalidate)
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().slice(0, 10),
    type: "EXPENSE",
    category: "",
    memo: "",
    amount: "",
  });

async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  const amtStr = form.amount.trim();
  // 공란만 막고, 숫자인지만 체크 (0도 허용하려면 그대로 두세요)
  if (amtStr === "" || Number.isNaN(Number(amtStr))) return;

  m.mutate(
    {
      date: form.date,
      type: form.type,
      category: form.category,
      memo: form.memo || undefined,
      amount: Number(amtStr),
    },
    {
      onSuccess: () => {
        // 입력창만 리셋
        setForm((f) => ({ ...f, category: "", memo: "", amount: "" }));
      },
    }
  );
}


  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
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
        type="number"
        min={0}
        value={form.amount}
        onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
      />
      <button disabled={m.isPending}>추가</button>
    </form>
  );
}
