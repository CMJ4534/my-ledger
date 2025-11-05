import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

type Row = { name: string; value: number };
export default function CategoryDonut({ data = [] as Row[] }: { data?: Row[] }) {
  // data가 배열이 아니거나 비어있으면 안전 처리
  if (!Array.isArray(data) || data.length === 0) {
    return <p style={{ opacity: 0.7 }}>해당 월 데이터가 없습니다.</p>;
  }
  const COLORS = ["#0088FE","#00C49F","#FFBB28","#FF8042","#A78BFA","#F472B6","#34D399","#60A5FA","#F59E0B","#EF4444"];
  return (
    <PieChart width={360} height={260}>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}
           label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
           labelLine={false}>
        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
      </Pie>
      <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
      <Legend />
    </PieChart>
  );
}
