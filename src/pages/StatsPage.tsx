import { useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import MonthPicker from "../components/MonthPicker";
import { PieChart, Pie, Cell, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export default function StatsPage() {
  const { data = [] } = useTransactions();


  
  // 월 선택 (기본: 이번 달)
  const today = new Date();
  const ym0 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(ym0);

  // 선택 월, 지난달 문자열
  const [prevMonthStr, currMonthStr] = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const prev = new Date(y, m - 2, 1); // 지난달
    const p = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return [p, month];
  }, [month]);

  // 월 데이터 필터
  const monthData = useMemo(() => data.filter(t => (t?.date ?? "").startsWith(currMonthStr)), [data, currMonthStr]);
  const prevMonthData = useMemo(() => data.filter(t => (t?.date ?? "").startsWith(prevMonthStr)), [data, prevMonthStr]);

  // 합계
  const income = monthData.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = monthData.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const total = income - expense;

  const prevIncome = prevMonthData.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevMonthData.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  
  // 증감률(%)
  const pct = (curr: number, prev: number) => (prev === 0 ? (curr === 0 ? 0 : 100) : ((curr - prev) / prev) * 100);
  const incomePct = pct(income, prevIncome);
  const expensePct = pct(expense, prevExpense);

  // 카테고리별 지출 합계 (도넛)
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

  // 월별 막대(수입/지출) 비교 데이터
  const barData = [
    { name: "지난달", 수입: prevIncome, 지출: prevExpense },
    { name: "이번달", 수입: income, 지출: expense },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>통계</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <MonthPicker value={month} onChange={setMonth} />
        <div style={{ opacity: 0.9 }}>
          총합: <b>{total.toLocaleString()} 원</b> &nbsp;
          (수입 {income.toLocaleString()} / 지출 {expense.toLocaleString()})
        </div>
      </div>

      {/* 지난달 대비 간략 지표 */}
      <div style={{ display: "flex", gap: 16 }}>
        <StatCard label="수입" value={income} prev={prevIncome} pct={incomePct} />
        <StatCard label="지출" value={expense} prev={prevExpense} pct={expensePct} />
      </div>

      {/* 수입/지출 월 비교 바차트 */}
      <div style={{ overflowX: "auto" }}>
        <BarChart width={480} height={280} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
          <Legend />
          <Bar dataKey="수입" />
          <Bar dataKey="지출" />
        </BarChart>
      </div>

      {/* 카테고리별 지출 도넛 */}
      <div>
        <h3>카테고리별 지출</h3>
        {categoryData.length === 0 ? (
          <p>지출 데이터가 없습니다.</p>
        ) : (
          <PieChart width={360} height={320}>
            <Pie
              data={categoryData}
              dataKey="value"
              nameKey="name"
              outerRadius={110}
              label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(1)}%`}
            >
              {categoryData.map((_, i) => (
                <Cell key={i} /> // 색상 지정 생략(요청 시 추가 가능)
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
            <Legend />
          </PieChart>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, prev, pct }: { label: string; value: number; prev: number; pct: number }) {
  const sign = pct > 0 ? "+" : "";
  const color = pct > 0 ? "#d32f2f" : pct < 0 ? "#2e7d32" : "#555";
  return (
    <div style={{ flex: 1, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
      <div style={{ fontSize: 14, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value.toLocaleString()} 원</div>
      <div style={{ fontSize: 12, color: "#666" }}>지난달: {prev.toLocaleString()} 원</div>
      <div style={{ fontSize: 12, color }}>{sign}{pct.toFixed(1)}%</div>
    </div>
  );
}


