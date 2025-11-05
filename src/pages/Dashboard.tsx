import { useMemo } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useTransactions } from "../features/transactions/useTransactions";
import CategoryDonut from "../components/CategoryDonut";
// ⚠️ SafePie, MonthPicker는 사용하지 않음 (import 하지 말 것)

export default function Dashboard() {
  const { data = [] } = useTransactions();

  // 월 필터 없이 전체 데이터 사용
  const monthData = data ?? [];

  const income = useMemo(
    () => monthData.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
    [monthData]
  );
  const expense = useMemo(
    () => monthData.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    [monthData]
  );
  const total = income - expense;

  // 수입/지출 비율 차트 데이터
  const chartData = [
    { name: "수입", value: Number(income || 0) },
    { name: "지출", value: Number(expense || 0) },
  ];

  // 카테고리별 지출 합계 (지출만)
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthData) {
      if (t.type !== "EXPENSE") continue;
      const key = (t.category ?? "").trim() || "기타";
      map.set(key, (map.get(key) ?? 0) + t.amount);
    }
    return Array.from(map, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthData]);

  return (
    <div>
      <h2>가계부</h2>

      <div style={{ opacity: 0.8, margin: "8px 0 16px" }}>
        총합: <strong>{total.toLocaleString()} 원</strong>{" "}
        (수입 {income.toLocaleString()} • 지출 {expense.toLocaleString()})
      </div>

      {/* 수입/지출 비율 그래프 (Recharts 직접 사용) */}
      <PieChart width={320} height={320}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label={({ name, percent = 0 }: { name?: string; percent?: number }) =>
            `${name ?? ""}: ${(percent * 100).toFixed(1)}%`
          }
        >
          {/* 수입 / 지출 색상 */}
          <Cell fill="#4CAF50" />
          <Cell fill="#F44336" />
        </Pie>
        <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
        <Legend />
      </PieChart>

      {/* 카테고리 도넛 */}
      <h3 style={{ marginTop: 24 }}>카테고리별 지출</h3>
      <CategoryDonut data={categoryData} />

      {/* Top 5 표 (선택) */}
      <ul>
        {categoryData.slice(0, 5).map((c) => (
          <li key={c.name}>
            {c.name} · {c.value.toLocaleString()}원
          </li>
        ))}
      </ul>
    </div>
  );
}
