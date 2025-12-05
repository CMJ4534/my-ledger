// src/pages/DashboardPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import MonthPicker from "../components/MonthPicker";
import { useBudget } from "../features/budget/useBudget";
import { useCategoryBudget } from "../features/budget/useCategoryBudget";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TopNav } from "../components/TopNav";

type Tx = {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category?: string;
  memo?: string;
  amount: number;
};

// ======================================================
// 카테고리 매핑: 원시 입력 → 대분류/소분류 체계화
// ======================================================

const CATEGORY_MAJOR_MAP: Record<string, string> = {
  // 식비 계열
  "아침": "식비",
  "점심": "식비",
  "저녁": "식비",
  "간식": "식비",
  "야식": "식비",
  "음료": "식비",
  "외식": "식비",
  "카페": "식비",

  // 교통 계열 👉 전부 "교통"으로 통일
  "교통": "교통",           // 그대로 써도 "교통" 대분류
  "교통비": "교통",         // 원시값이 교통비여도 대분류는 "교통"
  "버스": "교통",
  "지하철": "교통",
  "택시": "교통",
  "기후동행카드": "교통",   // 여기도 교통으로 바꿔줘야 함

  // 건강 계열
  "병원": "건강",
  "약국": "건강",
  "운동": "건강",

  // 주거/통신 계열
  "월세": "주거/통신",
  "관리비": "주거/통신",
  "통신비": "주거/통신",

  // 학자금 계열
  "학자금": "학자금 대출",
  "등록금": "학자금 대출",

  // 생활용품
  "생필품": "생활용품",
  "생활용품": "생활용품",
};

// 대분류 목록 (셀렉트 박스에서 쓸 옵션)
const MAJOR_CATEGORIES = [
  "식비",
  "교통",
  "건강",
  "주거/통신",
  "학자금 대출",
  "생활용품",
  "기타",
];

// 원시 카테고리를 (대분류, 소분류)로 변환하는 함수
function getMajorAndSub(rawCategory?: string) {
  const raw = (rawCategory ?? "기타").trim();

  // "식비 > 외식" 같이 이미 대분류 > 소분류로 들어온 건 그대로 사용
  if (raw.includes(">")) {
    const [m, s] = raw.split(">");
    return {
      major: (m ?? "").trim() || "기타",
      sub: (s ?? "").trim() || "기타",
    };
  }

  // 1) 우리가 정의한 매핑이 있으면 그걸 대분류로 사용
  const mappedMajor = CATEGORY_MAJOR_MAP[raw];
  if (mappedMajor) {
    return { major: mappedMajor, sub: raw }; // 예: "버스" → major: "교통", sub: "버스"
  }

  // 2) 그 외의 것은 전부 "기타" 대분류로 묶기
  //    예: "유튜브" → major: "기타", sub: "유튜브"
  return { major: "기타", sub: raw || "기타" };
}

export default function DashboardPage() {
  const { data = [], isLoading } = useTransactions();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const ym0 = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [month, setMonth] = useState(ym0); // YYYY-MM

  // ====== 월 전체 예산 ======
  const { budget, setBudget } = useBudget(month);
  const [budgetInput, setBudgetInput] = useState<string>("");

  useEffect(() => {
    setBudgetInput(budget > 0 ? String(budget) : "");
  }, [budget, month]);

  // ====== 카테고리별 예산 ======
  const { categoryBudgets, setCategoryBudget } = useCategoryBudget(month);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");

  // ====== 선택 월 거래 ======
  const monthTx: Tx[] = useMemo(
    () => data.filter((t: any) => (t?.date ?? "").startsWith(month)) as Tx[],
    [data, month]
  );

  // 수입/지출 합계
  const { income, expense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const t of monthTx) {
      if (t.type === "INCOME") inc += t.amount;
      if (t.type === "EXPENSE") exp += t.amount;
    }
    return { income: inc, expense: exp };
  }, [monthTx]);

  const net = income - expense;

  // 월 일수
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();
  const isCurrentMonth = month === ym0;

  // ====== "오늘까지 권장 지출" 계산 ======
  let recommendedToToday = 0;
  let spentToToday = 0;
  let diffToToday = 0;
  if (budget > 0 && isCurrentMonth) {
    const dayIndex = today.getDate(); // 1..daysInMonth
    recommendedToToday = Math.floor((budget * dayIndex) / daysInMonth);

    spentToToday = monthTx
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          t.date >= `${month}-01` &&
          t.date <= todayStr
      )
      .reduce((s, t) => s + t.amount, 0);

    diffToToday = recommendedToToday - spentToToday;
  }

  // ====== "이번 달 남은 예산 / 하루 권장 지출" ======
  const remainingBudget =
    budget > 0 ? Math.max(budget - expense, budget - expense) : null;

  let remainingDays = 0;
  if (budget > 0) {
    if (isCurrentMonth) {
      remainingDays = Math.max(daysInMonth - today.getDate() + 1, 0);
    } else if (month > ym0) {
      remainingDays = daysInMonth;
    } else {
      remainingDays = 0;
    }
  }

// ====== 예산 / 실제 자금 사용률 ======
const budgetUsageRatio =
  budget > 0 ? Math.min(expense / budget, 1) : null; // 설정 예산 기준

const realTotalMoney = income - expense; // 내가 현재 가지고 있는 돈(잔액)
const incomeUsageRatio =
  income > 0 ? Math.min(expense / income, 1) : null; // 실제 수입 기준 사용률


  const recommendedPerDay =
    remainingBudget !== null && remainingBudget > 0 && remainingDays > 0
      ? Math.floor(remainingBudget / remainingDays)
      : 0;

  // ====== 카테고리별 지출: ★대분류 기준으로 다시 계산★ ======
  const majorCategoryUsage = useMemo(() => {
    const map = new Map<string, number>();

    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;

      const { major } = getMajorAndSub(t.category);
      map.set(major, (map.get(major) ?? 0) + t.amount);
    }

    return map;
  }, [monthTx]);

  // 대분류 리스트 (지출 상위 카테고리용)
  const majorCategoryList = useMemo(
    () =>
      Array.from(majorCategoryUsage, ([name, value]) => ({ name, value })).sort(
        (a, b) => b.value - a.value
      ),
    [majorCategoryUsage]
  );

  // 대분류 중 최다 지출 (하단 요약용)
  const topMajorCategory = useMemo(() => {
    let bestName: string | null = null;
    let bestValue = 0;
    for (const [name, value] of majorCategoryUsage) {
      if (value > bestValue) {
        bestValue = value;
        bestName = name;
      }
    }
    if (!bestName) return null;
    return { name: bestName, value: bestValue };
  }, [majorCategoryUsage]);

  // ====== 지출 상위 카테고리: 대분류 클릭 시 소분류 보여주기 ======
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const subCategoryData = useMemo(() => {
    if (!selectedMajor) return [];

    const m = new Map<string, number>();

    for (const t of monthTx) {
      if (t.type !== "EXPENSE") continue;

      const { major, sub } = getMajorAndSub(t.category);
      if (major !== selectedMajor) continue;

      m.set(sub, (m.get(sub) ?? 0) + t.amount);
    }

    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value
    );
  }, [monthTx, selectedMajor]);

  // ====== 카테고리별 예산 경고 (80% 이상 사용) ======
  const categoryRows = useMemo(
    () => Object.keys(categoryBudgets).sort(),
    [categoryBudgets]
  );

  const categoryAlerts = useMemo(() => {
    const alerts: {
      name: string;
      budget: number;
      spent: number;
      ratio: number;
      remainingDays: number;
      recommendedPerDay: number;
    }[] = [];

    for (const name of categoryRows) {
      const budgetForCat = categoryBudgets[name] ?? 0;
      if (!budgetForCat) continue;

      const spent = majorCategoryUsage.get(name) ?? 0;
      const ratio = spent / budgetForCat;
      if (ratio < 0.8) continue;

      const remaining = Math.max(budgetForCat - spent, 0);
      const days = remainingDays;
      const perDay =
        remaining > 0 && days > 0 ? Math.floor(remaining / days) : 0;

      alerts.push({
        name,
        budget: budgetForCat,
        spent,
        ratio,
        remainingDays: days,
        recommendedPerDay: perDay,
      });
    }

    alerts.sort((a, b) => b.ratio - a.ratio);
    return alerts;
  }, [categoryRows, categoryBudgets, majorCategoryUsage, remainingDays]);

    // ====== 전체 예산 경고 (80% 이상 / 100% 초과) ======
  const overallBudgetAlert = useMemo(() => {
    if (budget <= 0) return null;
    if (expense <= 0) return null;

    const ratio = expense / budget; // 0.0 ~
    if (ratio < 0.8) return null;   // 80% 미만이면 경고 안 띄움

    const percentText = (ratio * 100).toFixed(1);

    if (ratio >= 1) {
      // 예산 100% 초과
      return {
        level: "danger" as const,
        title: "이번 달 전체 예산을 이미 모두 사용했어요.",
        detail: `설정한 예산 ${budget.toLocaleString()}원 중 ${expense.toLocaleString()}원을 사용했습니다.`,
      };
    }

    // 80% 이상 ~ 100% 미만
    return {
      level: "warn" as const,
      title: `이번 달 전체 예산의 ${percentText}%를 사용했어요.`,
      detail: `설정한 예산 ${budget.toLocaleString()}원 중 ${expense.toLocaleString()}원을 사용했습니다.`,
    };
  }, [budget, expense]);


  // ====== 가장 많이 쓴 날 ======
  const biggestSpendingDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of monthTx) {
      if (t.type !== "EXPENSE" || !t.date) continue;
      m.set(t.date, (m.get(t.date) ?? 0) + t.amount);
    }
    if (m.size === 0) return null;

    let maxDate = "";
    let maxAmount = 0;
    for (const [date, amount] of m) {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxDate = date;
      }
    }
    return { date: maxDate, amount: maxAmount };
  }, [monthTx]);

  // 하루 평균 지출
  const avgExpensePerDay =
    daysInMonth > 0 ? Math.round(expense / daysInMonth) : 0;

  // ====== 수입 vs 지출 파이차트 ======
  const pieData = useMemo(
    () => [
      { name: "수입", value: income },
      { name: "지출", value: expense },
    ],
    [income, expense]
  );

  function handleSaveBudget() {
    const n = Number(budgetInput.replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) return;
    setBudget(n);
  }

  function handleAddCategoryBudget() {
    const name = newCategoryName.trim();
    const value = Number(newCategoryBudget.replace(/,/g, ""));
    if (!name || !Number.isFinite(value) || value <= 0) return;
    setCategoryBudget(name, value);
    setNewCategoryName("");
    setNewCategoryBudget("");
  }

  if (isLoading) {
    return <p style={{ padding: 24 }}>불러오는 중...</p>;
  }

return (
  <div className="page-container">

      <h2>대시보드</h2>

      {/* 상단: 월 선택 + 총합 + 오늘까지 권장 지출 안내 */}
      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <MonthPicker value={month} onChange={setMonth} />
          <div style={{ fontSize: 15 }}>
            총합: <b>{net.toLocaleString()} 원</b>{" "}
            <span style={{ color: "#555" }}>
              (수입 {income.toLocaleString()} · 지출{" "}
              {expense.toLocaleString()})
            </span>
          </div>
        </div>

        {budget > 0 && isCurrentMonth && (
          <div
            style={{
              marginTop: 4,
              padding: 10,
              borderRadius: 10,
              border: "1px solid #e0e0e0",
              background: "#f9fafb",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <b>오늘까지 권장 지출 가이드</b>
            <div>
              오늘까지 권장 누적 지출은{" "}
              <b>{recommendedToToday.toLocaleString()}원</b>이고, 실제로는{" "}
              <b>{spentToToday.toLocaleString()}원</b>을 사용했습니다.
            </div>
            <div>
              {diffToToday > 0 ? (
                <>
                  아직 권장치보다{" "}
                  <b>{diffToToday.toLocaleString()}원</b> 덜 쓴 상태예요.
                </>
              ) : diffToToday < 0 ? (
                <>
                  권장치보다{" "}
                  <b>{Math.abs(diffToToday).toLocaleString()}원</b> 더 사용
                  중입니다.
                </>
              ) : (
                <>권장 지출과 거의 비슷하게 쓰고 있어요.</>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 예산 설정 + 전체 남은 예산 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 16,
        }}
      >
        {/* 월 전체 예산 설정 */}
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #eee",
            background: "#fafafa",
            display: "grid",
            gap: 6,
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600 }}>이번 달 전체 예산</div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="number"
              min={0}
              placeholder="예: 500000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              style={{ width: 140, padding: "4px 6px", fontSize: 13 }}
            />
            <button
              type="button"
              onClick={handleSaveBudget}
              style={{
                padding: "4px 10px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              저장
            </button>
            {budget > 0 && (
              <span style={{ color: "#555" }}>
                설정된 예산: <b>{budget.toLocaleString()}원</b>
              </span>
            )}
          </div>
          {budget > 0 && (
            <div style={{ color: "#666" }}>
              남은 예산{" "}
              <b>{(remainingBudget ?? 0).toLocaleString()}원</b>
              {remainingDays > 0 && remainingBudget !== null && (
                <>
                  , 남은 {remainingDays}일 기준 하루{" "}
                  <b>{recommendedPerDay.toLocaleString()}원</b> 사용 가능
                </>
              )}
            </div>
          )}
        </div>

        {/* 요약 카드 3개 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 8,
          }}
        >
          <SummaryCard
            label="총 수입"
            value={income}
            color="#2e7d32"
            description="이번 달 들어온 금액"
          />
          <SummaryCard
            label="총 지출"
            value={expense}
            color="#c62828"
            description="이번 달 나간 금액"
          />
          <SummaryCard
            label="하루 평균 지출"
            value={avgExpensePerDay}
            color="#1565c0"
            description={`${daysInMonth}일 기준 평균`}
          />
        </div>
      </div>


      {/* 🔔 전체 예산 + 카테고리별 예산 경고 카드 */}
      {(overallBudgetAlert || categoryAlerts.length > 0) && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border:
              overallBudgetAlert?.level === "danger"
                ? "1px solid #ef5350"
                : "1px solid #ffe082",
            background:
              overallBudgetAlert?.level === "danger"
                ? "#ffebee"
                : "#fff8e1",
            fontSize: 13,
          }}
        >
          <b>예산 경고</b>

          {/* 전체 예산 경고 메시지 */}
          {overallBudgetAlert && (
            <div style={{ marginTop: 4, marginBottom: 6, lineHeight: 1.6 }}>
              <div>{overallBudgetAlert.title}</div>
              <div style={{ color: "#555" }}>{overallBudgetAlert.detail}</div>
            </div>
          )}

          {/* 카테고리별 예산 경고 리스트 */}
          {categoryAlerts.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {categoryAlerts.slice(0, 3).map((a) => (
                <li key={a.name}>
                  ⛔ <b>{a.name}</b> 예산의{" "}
                  <b>{(a.ratio * 100).toFixed(1)}%</b>를 이미 사용했어요.
                  {" "}
                  (예산 {a.budget.toLocaleString()}원 중{" "}
                  {a.spent.toLocaleString()}원 사용)
                  {a.remainingDays > 0 && a.recommendedPerDay > 0 && (
                    <>
                      {" "}
                      남은 {a.remainingDays}일 동안 하루{" "}
                      <b>{a.recommendedPerDay.toLocaleString()}원</b> 이하로 쓰면
                      예산 안에서 유지돼요.
                    </>
                  )}
                </li>

              ))}
            </ul>
          )}
        </div>
      )}

      {/* 카테고리별 예산 관리 섹션 */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #eee",
          display: "grid",
          gap: 12,
          fontSize: 13,
        }}
      >
        <h3 style={{ margin: 0 }}>카테고리별 예산 관리</h3>
        <div style={{ color: "#666" }}>
          예: 식비 300,000원, 카페/간식 100,000원, 교통 50,000원처럼
          카테고리별로 한도를 설정할 수 있습니다. 거래의{" "}
          <code>카테고리</code>에서 <b>'식비 &gt; 간식'</b>처럼 입력해도,
          여기서는 <b>'식비'</b> 단위로 합산합니다.
        </div>

        {/* 새 카테고리 예산 추가 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          {/* 🔽 대분류 선택 셀렉트 박스 */}
          <select
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            style={{ minWidth: 140, padding: "4px 6px" }}
          >
            <option value="">카테고리 선택</option>
            {MAJOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <input
            placeholder="예산 금액 (예: 300000)"
            value={newCategoryBudget}
            onChange={(e) => setNewCategoryBudget(e.target.value)}
            style={{ width: 120, padding: "4px 6px" }}
          />
          <button
            type="button"
            onClick={handleAddCategoryBudget}
            style={{ padding: "4px 10px", cursor: "pointer" }}
          >
            추가/수정
          </button>
        </div>

        {/* 카테고리별 예산/사용량 테이블 */}
        <div
          style={{
            borderRadius: 8,
            border: "1px solid #eee",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 2fr 2fr 1fr",
              padding: "6px 10px",
              background: "#f5f5f5",
              fontWeight: 600,
            }}
          >
            <span>카테고리</span>
            <span>예산</span>
            <span>사용 금액</span>
            <span>사용률</span>
          </div>
          {categoryRows.length === 0 ? (
            <div style={{ padding: 10, fontSize: 13, color: "#777" }}>
              설정된 카테고리 예산이 없습니다. 위에서 추가해 보세요.
            </div>
          ) : (
            categoryRows.map((name) => {
              const budgetForCat = categoryBudgets[name] ?? 0;
              const spent = majorCategoryUsage.get(name) ?? 0;
              const ratio =
                budgetForCat > 0 ? (spent / budgetForCat) * 100 : null;

              const ratioText =
                ratio === null ? "-" : `${ratio.toFixed(1)}%`;
              const ratioColor =
                ratio === null
                  ? "#555"
                  : ratio >= 100
                  ? "#c62828"
                  : ratio >= 80
                  ? "#ef6c00"
                  : "#2e7d32";

              return (
                <div
                  key={name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 2fr 1fr",
                    padding: "6px 10px",
                    borderTop: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <span>{name}</span>
                  <span>
                    {budgetForCat > 0
                      ? `${budgetForCat.toLocaleString()}원`
                      : "-"}
                  </span>
                  <span>{spent.toLocaleString()}원</span>
                  <span style={{ color: ratioColor }}>{ratioText}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 수입 vs 지출 / 지출 상위 카테고리 (대분류 + 소분류) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 24,
        }}
      >
        {/* 수입 vs 지출 파이차트 */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid #eee",
          }}
        >
          <h3 style={{ marginBottom: 8 }}>수입 vs 지출 비율</h3>
          {income === 0 && expense === 0 ? (
            <p>이번 달 데이터가 없습니다.</p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(1)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === 0 ? "#4caf50" : "#ef5350"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `${v.toLocaleString()} 원`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 지출 상위 카테고리: 대분류 + 선택 시 소분류 */}
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid #eee",
            display: "grid",
            gap: 8,
          }}
        >
          <h3 style={{ marginBottom: 4 }}>지출 상위 카테고리</h3>

          {majorCategoryList.length === 0 ? (
            <p>지출 데이터가 없습니다.</p>
          ) : (
            <>
              {/* 대분류 리스트 */}
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  fontSize: 14,
                }}
              >
                {majorCategoryList.map((c) => {
                  const isSelected = c.name === selectedMajor;
                  return (
                    <li key={c.name} style={{ marginBottom: 4 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedMajor((prev) =>
                            prev === c.name ? null : c.name
                          )
                        }
                        style={{
                          width: "100%",
                          textAlign: "left",
                          borderRadius: 6,
                          border: "1px solid #eee",
                          padding: "6px 8px",
                          background: isSelected ? "#e3f2fd" : "#fafafa",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{c.name}</span>
                        <span>{c.value.toLocaleString()}원</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* 선택된 대분류의 소분류 breakdown */}
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: "1px solid #eee",
                  fontSize: 13,
                }}
              >
                {selectedMajor ? (
                  subCategoryData.length === 0 ? (
                    <div style={{ color: "#777" }}>
                      <b>{selectedMajor}</b> 하위에 등록된 소분류가 없습니다.
                      <br />
                      카테고리를 <code>{selectedMajor} &gt; 외식</code> 처럼
                      입력해보세요.
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: 4 }}>
                        <b>{selectedMajor}</b> 소분류 지출
                      </div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: 18,
                          fontSize: 13,
                        }}
                      >
                        {subCategoryData.map((s) => (
                          <li key={s.name}>
                            {s.name} · {s.value.toLocaleString()}원
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                ) : (
                  <div style={{ color: "#777" }}>
                    대분류 항목(예: 식비, 교통)을 클릭하면 하위 카테고리
                    breakdown이 여기에 표시됩니다.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단: 소비 요약 */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #eee",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <h3 style={{ marginBottom: 8 }}>이번 달 소비 요약</h3>
        {monthTx.length === 0 ? (
          <p>아직 등록된 거래가 없습니다.</p>
        ) : (
          <>
            <p>
              이번 달에는 총{" "}
              <b>{monthTx.length.toLocaleString()}건</b>의 거래가 있었고, 순
              자산 변화는{" "}
              <b
                style={{
                  color: net > 0 ? "#2e7d32" : net < 0 ? "#c62828" : "#555",
                }}
              >
                {net.toLocaleString()}원
              </b>{" "}
              입니다.
            </p>
            {budget > 0 && (
              <p>
                설정한 예산 <b>{budget.toLocaleString()}원</b> 중{" "}
                <b>{expense.toLocaleString()}원</b>을 사용하여{" "}
                <b>
                  {(remainingBudget ?? 0).toLocaleString()}원
                </b>{" "}
                이 남아 있습니다.
              </p>
            )}
            {topMajorCategory && (
              <p>
                지출이 가장 많았던 카테고리는{" "}
                <b>{topMajorCategory.name}</b>(
                {topMajorCategory.value.toLocaleString()}원) 입니다.
              </p>
            )}
            {biggestSpendingDay && (
              <p>
                가장 많이 쓴 날은 <b>{biggestSpendingDay.date}</b> 이고, 그날
                지출은{" "}
                <b>{biggestSpendingDay.amount.toLocaleString()}원</b> 입니다.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UsageBar(props: {
  label: string;
  used: number;
  total: number;
  ratio: number | null;
  color?: string;
}) {
  const { label, used, total, ratio, color = "#ef5350" } = props;
  if (!ratio || total <= 0) return null;

  const percent = (ratio * 100).toFixed(1);

  const usedRatio = Math.min(ratio ?? 0, 1);
  const remainingRatio = 1 - usedRatio;

  const usedPercent = (usedRatio * 100).toFixed(1);
  const remainingPercent = (remainingRatio * 100).toFixed(1);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
        gap: 16,
        alignItems: "center",
        marginTop: 8,
      }}
    >
      {/* 막대 */}
      <div
        style={{
          border: "2px solid #000",
          borderRadius: 4,
          height: 30,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
          }}
        >
          {/* 사용한 부분 */}
          <div
            style={{
              width: `${usedPercent}%`,
              background: color, // 예: 빨강/주황
              transition: "width 0.3s ease",
            }}
          />
          {/* 남은 부분 */}
          <div
            style={{
              width: `${remainingPercent}%`,
              background: "#f5f5f5", // 연한 회색으로 남은 구간 표시
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{ fontSize: 13, color: "#c62828" }}>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div>
           총 {total.toLocaleString()}원 중{" "}
          <b>{usedPercent}% 사용</b> (
          {used.toLocaleString()}원 사용,{" "}
          <span style={{ color: "#2e7d32" }}>
            {remainingPercent}% ({(total - used).toLocaleString()}원) 남음
          </span>
              </div>
    )
      </div>
    </div>
  );
}

function SummaryCard(props: {
  label: string;
  value: number;
  color: string;
  description?: string;
}) {
  const { label, value, color, description } = props;
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid #eee",
        background: "#fafafa",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 13, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>
        {value.toLocaleString()} 원
      </div>
      {description && (
        <div style={{ fontSize: 12, color: "#777" }}>{description}</div>
      )}
    </div>
  );
}


