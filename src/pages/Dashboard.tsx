import { useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import MonthPicker from "../components/MonthPicker";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

export default function Dashboard() {
  const { data = [] } = useTransactions();
  const today = new Date();
  const ym0 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(ym0);

  // 해당 월 데이터
  const monthData = useMemo(
    () => data.filter((t) => (t?.date ?? "").startsWith(month)),
    [data, month]
  );

  const income = monthData.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = monthData.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const total = income - expense;

  // 수입/지출 비율 차트
  const ratioData = [
    { name: "수입", value: income },
    { name: "지출", value: expense },
  ];

  // 카테고리별 지출 합계 (지출만)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthData) {
      if (t.type !== "EXPENSE") continue;
      const key = (t.category ?? "기타").trim() || "기타";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthData]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>대시보드</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <MonthPicker value={month} onChange={setMonth} />
        <div>
          총합: <strong>{total.toLocaleString()} 원</strong>{" "}
          (수입 {income.toLocaleString()} • 지출 {expense.toLocaleString()})
        </div>
      </div>

      {/* 수입/지출 비율 */}
      <PieChart width={340} height={320}>
        <Pie
          data={ratioData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          <Cell fill="#4CAF50" />
          <Cell fill="#F44336" />
        </Pie>
        <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
        <Legend />
      </PieChart>

      {/* 카테고리 Top5 */}
      <div>
        <h3>카테고리별 지출 Top 5</h3>
        <ul>
          {categoryData.slice(0, 5).map((c) => (
            <li key={c.name}>
              {c.name} · {c.value.toLocaleString()}원
            </li>
          ))}
          {categoryData.length === 0 && <li>지출 데이터 없음</li>}
        </ul>
      </div>
    </div>
  );
}
