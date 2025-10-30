import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useTransactions } from "../features/transactions/useTransactions";

export default function Dashboard() {
  // ← data가 undefined여도 빈 배열로 처리
  const { data = [] } = useTransactions();

  const income = data
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = data
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const chartData = [
    { name: "수입", value: income },
    { name: "지출", value: expense },
  ];

  return (
    <div>
      <h2>대시보드</h2>
      <PieChart width={300} height={300}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          outerRadius={100}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          <Cell fill="#4CAF50" />
          <Cell fill="#F44336" />
        </Pie>
        <Tooltip formatter={(v: number) => `${v.toLocaleString()} 원`} />
        <Legend />
      </PieChart>
    </div>
  );
}
