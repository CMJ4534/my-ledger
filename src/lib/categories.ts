// src/lib/categories.ts

// 카테고리 타입
export type CategoryType = "EXPENSE" | "INCOME";

// 카테고리 한 개 형태
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  builtIn: boolean; // 기본 제공인지, 사용자가 추가한 건지
}

// 기본 라벨만 먼저 정의
const EXPENSE_LABELS = [
  "식비",
  "카페/간식",
  "교통",
  "쇼핑",
  "취미/여가",
  "주거/공과금",
  "여행",
  "교육",
  "의료",
  "기타",
] as const;

const INCOME_LABELS = [
  "급여",
  "용돈",
  "보너스",
  "투자",
  "환급",
  "기타",
] as const;

// 라벨을 Category 형태로 변환
export const EXPENSE_CATEGORIES: Category[] = EXPENSE_LABELS.map(
  (name, idx) => ({
    id: `exp_${idx}`,
    name,
    type: "EXPENSE",
    builtIn: true,
  })
);

export const INCOME_CATEGORIES: Category[] = INCOME_LABELS.map(
  (name, idx) => ({
    id: `inc_${idx}`,
    name,
    type: "INCOME",
    builtIn: true,
  })
);

// 훅(useCategories)에서 쓰는 기본 카테고리 세트
export const DEFAULT_CATEGORIES: Category[] = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];
