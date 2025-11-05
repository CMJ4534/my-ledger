import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import ErrorBoundary from "./ErrorBoundary";

type Row = { name: string; value: number };

export default function SafePie({ data }: { data: Row[] }) {
  // 데이터 정제: NaN/undefined 제거 + 음수는 0 처리
  const clean = (Array.isArray(data) ? data : [])
    .map(d => ({ name: String(d?.name ?? ""), value: Number(d?.value ?? 0) }))
    .map(d => ({ ...d, value: Number.isFinite(d.value) && d.value > 0 ? d.value : 0 }))
    .filter(d => d.value >= 0);

  if (clean.length === 0) return <div style={{opacity:.7}}>표시할 데이터가 없습니다.</div>;

  const COLORS = ["#4CAF50","#F44336","#FFBB28","#00C49F","#A78BFA","#F472B6","#34D399","#60A5FA","#F59E0B","#EF4444"];

  return (
    <ErrorBoundary>
      <PieChart width={320} height={320}>
        <Pie
          data={clean}
          dataKey="value"
          nameKey="name"
          outerRadius={110}
          label={({ name, percent = 0 }: { name?: string; percent?: number }) =>
            `${name ?? ""}: ${(percent * 100).toFixed(1)}%`
          }
          labelLine={false}
        >
          {clean.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => `${Number(v ?? 0).toLocaleString()} 원`} />
        <Legend />
      </PieChart>
    </ErrorBoundary>
  );
}
