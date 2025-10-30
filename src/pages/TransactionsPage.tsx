import { useTransactions } from "../features/transactions/useTransactions";
import TransactionForm from "../features/transactions/TransactionForm";

export default function TransactionsPage() {
  const { data = [], isLoading } = useTransactions();

  const sum = data.reduce(
    (acc, t) => acc + (t.type === "INCOME" ? t.amount : -t.amount),
    0
  );

  return (
    <div>
      <h2>가계부</h2>
      <p>총합: {sum.toLocaleString()} 원</p>

      <TransactionForm />

      <hr />
      {isLoading ? (
        <p>로딩중…</p>
      ) : (
        <ul>
          {data.map((t) => (
            <li key={t.id}>
              [{t.type === "INCOME" ? "수입" : "지출"}] {t.date} • {t.category} •{" "}
              {t.memo ?? "-"} • {t.amount.toLocaleString()}원
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
