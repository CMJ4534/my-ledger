import { useTransactions } from "../features/transactions/useTransactions";
import TransactionForm from "../features/transactions/TransactionForm";

export default function TransactionsPage() {
  const { data = [], isLoading, add, remove } = useTransactions();

  const sum = data.reduce(
    (acc, t) => acc + (t.type === "INCOME" ? t.amount : -t.amount),
    0
  );

  return (
    <div>
      <h2>가계부</h2>
      <p>총합: {sum.toLocaleString()} 원</p>

      {/* ✅ 같은 인스턴스의 add를 내려보냄 */}
      <TransactionForm onAdd={add} />

      <hr />
      {isLoading ? (
        <p>로딩중…</p>
      ) : ( 
        <ul>
          {data.map((t) => (
            <li key={t.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ flex: 1 }}>
                [{t.type === "INCOME" ? "수입" : "지출"}] {t.date} • {t.category ?? "-"} •{" "}
                {t.memo ?? "-"} • {t.amount.toLocaleString()}원
              </span>
              <button onClick={() => remove(t.id)}>삭제</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
