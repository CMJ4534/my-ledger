// src/components/BudgetUsageSummary.tsx
import React from "react";

type Props = {
  income: number;   // 이번 달 수입 합계
  expense: number;  // 이번 달 지출 합계
  budget: number;   // 설정한 월 예산
};

export function BudgetUsageSummary({ income, expense, budget }: Props) {
  const net = income - expense;

  const budgetUsageRatio =
    budget > 0 ? Math.min(expense / budget, 1) : null;
  const incomeUsageRatio =
    income > 0 ? Math.min(expense / income, 1) : null;

  return (
    <div
      style={{
        marginTop: 8,
        padding: 16,
        borderRadius: 12,
        border: "1px solid #eee",
        background: "#fff",
        fontSize: 13,
        display: "grid",
        gap: 8,
      }}
    >
      <h3 style={{ margin: 0, marginBottom: 4 }}>예산 사용률</h3>
      <div style={{ color: "#666" }}>
        설정한 <b>목표 예산</b>과 실제 <b>수입 기준</b>으로 이번 달 지출이 어느
        정도인지 한눈에 볼 수 있습니다.
      </div>

      {budgetUsageRatio !== null && (
        <UsageBar
          label="① 설정한 월 예산 기준"
          used={expense}
          total={budget}
          ratio={budgetUsageRatio}
          color="#ef5350"
        />
      )}

      {incomeUsageRatio !== null && (
        <UsageBar
          label="② 실제 수입 기준"
          used={expense}
          total={income}
          ratio={incomeUsageRatio}
          color="#ff9800"
        />
      )}

      <div style={{ marginTop: 4, color: "#555" }}>
        현재 잔액(수입 - 지출)은{" "}
          <b style={{ color: net >= 0 ? "#2e7d32" : "#c62828" }}>
            {net.toLocaleString()}원
          </b>
          입니다.
      </div>
    </div>
  );
}

// 아까 쓰던 UsageBar 그대로 여기로 옮겨오면 됨 (수정한 버전)
function UsageBar(props: {
  label: string;
  used: number;
  total: number;
  ratio: number | null;
  color?: string;
}) {
  const { label, used, total, ratio, color = "#ef5350" } = props;
  if (ratio === null || total <= 0) return null;

  const usedRatio = Math.min(ratio, 1);
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
      {/* 전체 바 */}
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
          {/* 남은 예산 = 오른쪽 → 왼쪽 기준으로 꽉 찬 느낌 */}
          <div
            style={{
              width: `${remainingPercent}%`,
              background: color,
              transition: "width 0.3s ease",
            }}
          />

          {/* 사용한 예산 (뒤에 연하게 표시) */}
          <div
            style={{
              width: `${usedPercent}%`,
              background: "#ffe5e5",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* 설명 */}
      <div style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 600, color: "#333" }}>{label}</div>
        <div>
          {total.toLocaleString()}원 중{" "}
          <b style={{ color: "#c62828" }}>{usedPercent}% 사용</b> (
          {used.toLocaleString()}원) /{" "}
          <span style={{ color: "#2e7d32" }}>
            {remainingPercent}% 남음 ({(total - used).toLocaleString()}원)
          </span>
        </div>
      </div>
    </div>
  );
}

