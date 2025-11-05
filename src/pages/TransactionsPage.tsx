import { useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import TransactionForm from "../features/transactions/TransactionForm";
import MonthPicker from "../components/MonthPicker";

export default function TransactionsPage() {
  const { data = [], isLoading, add, remove } = useTransactions(); // ✅ 여기서만 훅 호출

  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return data.filter((t) => {
      const sameMonth = t.date.slice(0, 7) === month;
      const hit =
        q.trim() === "" ||
        (t.category ?? "").includes(q) ||
        (t.memo ?? "").includes(q);
      return sameMonth && hit;
    });
  }, [data, month, q]);

  const sum = useMemo(
    () =>
      filtered.reduce(
        (acc, t) => acc + (t.type === "INCOME" ? t.amount : -t.amount),
        0
      ),
    [filtered]
  );

  return (
    <div>
      {/* 검색/필터 바 - form 아님 */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <MonthPicker value={month} onChange={setMonth} />
        <input
          placeholder="검색(카테고리/메모)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1 }}
        />
        <b>총합: {sum.toLocaleString()} 원</b>
      </div>

      {/* ✅ add를 props로 전달 */}
      <div style={{ marginTop: 12 }}>
        <TransactionForm onAdd={add} />
      </div>

      <hr />

      {isLoading ? (
        <p>로딩중…</p>
      ) : (
        <ul>
          {filtered.map((t) => (
            <li key={t.id} style={{ display: "flex", gap: 8 }}>
              <span style={{ flex: 1 }}>
                [{t.type === "INCOME" ? "수입" : "지출"}] {t.date} ·{" "}
                {t.category ?? "-"} · {t.memo ?? "-"} ·{" "}
                {t.amount.toLocaleString()}원
              </span>
              <button onClick={() => remove(t.id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
