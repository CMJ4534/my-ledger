// src/pages/CalendarPage.tsx
import { useMemo, useState, FormEvent } from "react";
import { useTransactions } from "../features/transactions/useTransactions";
import MonthPicker from "../components/MonthPicker";
import { useBudget } from "../features/budget/useBudget";
import { BudgetUsageSummary } from "../components/BudgetUsageSummary";

type Tx = {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  category?: string;
  memo?: string;
  amount: number;
};

type FormState = {
  date: string;
  type: "EXPENSE" | "INCOME";
  majorCategory: string;
  subCategory: string;
  customCategory: string;
  memo: string;
  amount: string;
};

type PanelMode = "add" | "search" | null;

// ===== 지출/수입 카테고리 트리 =====
const CATEGORY_TREE: Record<"EXPENSE" | "INCOME", Record<string, string[]>> = {
  EXPENSE: {
    식비: ["식사", "간식", "카페/음료"],
    교통: ["대중교통", "택시", "주유"],
    생활: ["편의점", "생활용품"],
    고정비: ["주거/통신", "구독", "보험"],
    기타: ["기타"],
  },
  INCOME: {
    급여: ["기본급", "보너스"],
    용돈: ["부모님", "용돈/기타"],
    환급: ["세금환급", "캐시백"],
    기타: ["기타"],
  },
};

// 대분류 직접 입력용 특수 값
const CUSTOM_MAJOR = "__custom__";

export default function CalendarPage() {
  const { data = [], add, remove, isLoading } = useTransactions();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const ym0 = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  const [month, setMonth] = useState(ym0); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // + / 🔍 패널 상태
  const [panel, setPanel] = useState<PanelMode>(null);

  // 검색 / 필터 상태 (선택한 날짜 리스트용)
  const [typeFilter, setTypeFilter] =
    useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [query, setQuery] = useState("");

  // 예산 훅
  const { budget } = useBudget(month);

  // 추가 폼 상태
  const [form, setForm] = useState<FormState>({
    date: todayStr,
    type: "EXPENSE",
    majorCategory: "",
    subCategory: "",
    customCategory: "",
    memo: "",
    amount: "",
  });

  // ===== 타입별 카테고리 옵션 =====
  const majorOptions = Object.keys(CATEGORY_TREE[form.type]);

  const subOptions: string[] =
    form.majorCategory &&
    form.majorCategory !== CUSTOM_MAJOR &&
    CATEGORY_TREE[form.type][form.majorCategory]
      ? CATEGORY_TREE[form.type][form.majorCategory]
      : [];

  // ===== 선택 월 거래 =====
  const monthTx: Tx[] = useMemo(
    () => data.filter((t: any) => (t?.date ?? "").startsWith(month)) as Tx[],
    [data, month]
  );

  // ===== 캘린더 셀 계산 =====
  const [year, m] = month.split("-").map(Number);
  const firstDate = new Date(year, m - 1, 1);
  const firstDayOfWeek = firstDate.getDay(); // 0 = 일
  const daysInMonth = new Date(year, m, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // ===== 날짜별 수입/지출 합계 =====
  const byDate = useMemo(() => {
    const map = new Map<
      string,
      { income: number; expense: number; items: Tx[] }
    >();
    for (const t of monthTx) {
      const key = t.date;
      if (!map.has(key)) {
        map.set(key, { income: 0, expense: 0, items: [] });
      }
      const v = map.get(key)!;
      v.items.push(t);
      if (t.type === "INCOME") v.income += t.amount;
      else v.expense += t.amount;
    }
    return map;
  }, [monthTx]);

  // 월 수입 합계
  const totalIncome = useMemo(
    () =>
      monthTx
        .filter((t) => t.type === "INCOME")
        .reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );

  // 월 지출 합계 (예산용)
  const totalExpense = useMemo(
    () =>
      monthTx
        .filter((t) => t.type === "EXPENSE")
        .reduce((s, t) => s + t.amount, 0),
    [monthTx]
  );

  const remainingBudget =
    budget > 0 ? Math.max(budget - totalExpense, budget - totalExpense) : null;

  const isCurrentMonth = month === ym0;
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

  const recommendedPerDay =
    remainingBudget !== null && remainingBudget > 0 && remainingDays > 0
      ? Math.floor(remainingBudget / remainingDays)
      : 0;

  // ===== 선택 날짜 + 필터 적용 리스트 =====
  const selectedList: Tx[] = useMemo(() => {
    if (!selectedDate) return [];

    let list = monthTx.filter((t) => t.date === selectedDate);

    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (query.trim()) {
      const q = query.trim();
      list = list.filter(
        (t) =>
          (t.category ?? "").includes(q) || (t.memo ?? "").includes(q)
      );
    }

    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [monthTx, selectedDate, typeFilter, query]);

  // ===== 추가 폼 submit =====
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amt = Number((form.amount ?? "").trim());
    if (!Number.isFinite(amt) || amt <= 0) return;

    const dateToUse = selectedDate ?? form.date;

    const major = form.majorCategory;
    const sub = form.subCategory;
    const custom = form.customCategory.trim();

    let categoryStr: string | undefined;

    if (major === CUSTOM_MAJOR) {
      // 대분류를 직접 입력한 경우: custom만 사용
      categoryStr = custom || undefined;
    } else {
      // 기존 방식: "대분류 > 소분류" 또는 전체 직접입력
      categoryStr =
        custom || [major, sub].filter(Boolean).join(" > ") || undefined;
    }

    await add({
      date: dateToUse,
      type: form.type,
      category: categoryStr,
      memo: form.memo.trim() || undefined,
      amount: amt,
    });

    setForm((f) => ({
      ...f,
      majorCategory: "",
      subCategory: "",
      customCategory: "",
      memo: "",
      amount: "",
    }));
  }

  if (isLoading) {
    return <p style={{ padding: 24 }}>불러오는 중...</p>;
  }

  return (
    <div className="page-container">
      <h2>캘린더</h2>

      {/* 상단: 월 선택 + 버튼들 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <MonthPicker value={month} onChange={setMonth} />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setPanel((p) => (p === "add" ? null : "add"))}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid #ccc",
              background: panel === "add" ? "#1976d2" : "#fff",
              color: panel === "add" ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "30px",
            }}
            title="거래 추가"
          >
            +
          </button>

          <button
            type="button"
            onClick={() =>
              setPanel((p) => (p === "search" ? null : "search"))
            }
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid #ccc",
              background: panel === "search" ? "#1976d2" : "#fff",
              color: panel === "search" ? "#fff" : "#333",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: "30px",
            }}
            title="검색 / 필터"
          >
            🔍
          </button>
        </div>
      </div>

      {/* 예산 요약 표시 */}
      {budget > 0 && (
        <div style={{ fontSize: 13, color: "#555" }}>
          이번 달 예산 <b>{budget.toLocaleString()}원</b> 중{" "}
          <b>{totalExpense.toLocaleString()}원</b> 지출, 남은{" "}
          <b>{(remainingBudget ?? 0).toLocaleString()}원</b>
          {remainingDays > 0 &&
            remainingBudget !== null &&
            remainingBudget > 0 && (
              <>
                {" "}
                (하루 약 <b>{recommendedPerDay.toLocaleString()}원</b> 사용 가능)
              </>
            )}
        </div>
      )}

      {/* 예산 사용률 바 (설정 예산 vs 실제 수입 기준) */}
      {(budget > 0 || totalIncome > 0) && (
        <BudgetUsageSummary
          income={totalIncome}
          expense={totalExpense}
          budget={budget}
        />
      )}

      {/* 캘린더 */}
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
            fontSize: 13,
            marginBottom: 4,
            color: "#666",
          }}
        >
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} style={{ textAlign: "center" }}>
              {d}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;

            const dateStr = `${month}-${String(day).padStart(2, "0")}`;
            const info = byDate.get(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={idx}
                onClick={() =>
                  setSelectedDate((d) => (d === dateStr ? null : dateStr))
                }
                style={{
                  textAlign: "left",
                  padding: 10,
                  borderRadius: 10,
                  border: isSelected
                    ? "2px solid #1976d2"
                    : "1px solid #eee",
                  background: "#fff",
                  boxShadow: isSelected
                    ? "0 0 0 2px rgba(25,118,210,.08)"
                    : "",
                  cursor: "pointer",
                  minHeight: 80,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{day}일</span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: 10,
                        padding: "1px 4px",
                        borderRadius: 6,
                        background: "#fff3cd",
                        color: "#856404",
                      }}
                    >
                      오늘
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5 }}>
                  {info ? (
                    <>
                      <div>
                        수입:{" "}
                        <b style={{ color: "#2e7d32" }}>
                          {info.income.toLocaleString()}원
                        </b>
                      </div>
                      <div>
                        지출:{" "}
                        <b style={{ color: "#c62828" }}>
                          {info.expense.toLocaleString()}원
                        </b>
                      </div>
                    </>
                  ) : (
                    <span style={{ color: "#aaa" }}>내역 없음</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택 날짜 안내 */}
      <div style={{ fontSize: 13, color: "#555" }}>
        선택된 날짜:{" "}
        <b>{selectedDate ?? "없음 (캘린더에서 날짜를 클릭하세요)"}</b>
      </div>

      {/* + 패널 : 거래 추가 (대분류/소분류/직접입력) */}
      {panel === "add" && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: "1px solid #eee",
            display: "grid",
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0 }}>거래 추가</h3>
          <form
            onSubmit={onSubmit}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="date"
              value={selectedDate ?? form.date}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, date: v }));
                setSelectedDate(v);
              }}
            />

            <select
              value={form.type}
              onChange={(e) => {
                const nextType = e.target.value as "EXPENSE" | "INCOME";
                setForm((f) => ({
                  ...f,
                  type: nextType,
                  majorCategory: "",
                  subCategory: "",
                  customCategory: "",
                }));
              }}
            >
              <option value="EXPENSE">지출</option>
              <option value="INCOME">수입</option>
            </select>

            {/* 대분류 선택 or 직접 입력 */}
            <select
              style={{ minWidth: 120 }}
              value={form.majorCategory}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  majorCategory: e.target.value,
                  subCategory: "",
                }))
              }
            >
              <option value="">대분류 선택</option>
              {majorOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
              <option value={CUSTOM_MAJOR}>대분류 직접 입력</option>
            </select>

            {/* 소분류: 직접입력 모드일 땐 비활성화 */}
            <select
              style={{ minWidth: 120 }}
              value={form.subCategory}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  subCategory: e.target.value,
                }))
              }
              disabled={
                !form.majorCategory || form.majorCategory === CUSTOM_MAJOR
              }
            >
              <option value="">소분류 선택</option>
              {subOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>

            {/* 직접 입력 필드 */}
            <input
              style={{ flex: 1, minWidth: 140 }}
              placeholder={
                form.majorCategory === CUSTOM_MAJOR
                  ? "대분류 이름 직접 입력"
                  : "카테고리 전체 직접 입력(선택사항)"
              }
              value={form.customCategory}
              onChange={(e) =>
                setForm((f) => ({ ...f, customCategory: e.target.value }))
              }
            />

            <input
              style={{ flex: 2, minWidth: 160 }}
              placeholder="메모"
              value={form.memo}
              onChange={(e) =>
                setForm((f) => ({ ...f, memo: e.target.value }))
              }
            />
            <input
              style={{ width: 120 }}
              placeholder="금액"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />

            <button type="submit">추가</button>
          </form>
        </div>
      )}

      {/* 선택 날짜 리스트 + (옵션) 검색/필터 UI */}
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #eee",
          display: "grid",
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>선택한 날짜 내역</h3>

        {panel === "search" && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as "ALL" | "INCOME" | "EXPENSE"
                )
              }
            >
              <option value="ALL">전체</option>
              <option value="EXPENSE">지출만</option>
              <option value="INCOME">수입만</option>
            </select>
            <input
              style={{ flex: 1, minWidth: 200 }}
              placeholder="검색(카테고리/메모)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span style={{ fontSize: 13, color: "#666" }}>
              {selectedList.length}건 결과
            </span>
          </div>
        )}

        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
          {!selectedDate ? (
            <li style={{ color: "#888" }}>
              날짜를 선택하면 해당 날짜의 내역이 보입니다.
            </li>
          ) : selectedList.length === 0 ? (
            <li style={{ color: "#888" }}>표시할 내역이 없습니다.</li>
          ) : (
            selectedList.map((t) => (
              <li
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span style={{ flex: 1 }}>
                  [{t.type === "INCOME" ? "수입" : "지출"}] {t.date} ·{" "}
                  {t.category ?? ""} · {t.memo ?? ""} ·{" "}
                  {t.amount.toLocaleString()}원
                </span>
                <button onClick={() => remove(t.id)}>삭제</button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
