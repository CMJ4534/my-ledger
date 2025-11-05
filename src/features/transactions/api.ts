// src/features/transactions/api.ts
import type { Transaction } from "./types";

const KEY = "tx";

// 1) 목록 읽기 + 마이그레이션(예전 항목에 id 없으면 부여)
export async function listTransactions(): Promise<Transaction[]> {
  const raw = localStorage.getItem(KEY);
  const list: Transaction[] = raw ? JSON.parse(raw) : [];

  let changed = false;
  for (const t of list) {
    // id가 없으면 새로 부여
    if (!t.id) {
      // @ts-ignore: 런타임에서 속성 추가
      t.id = crypto.randomUUID();
      changed = true;
    }
    // amount를 숫자로 강제
    // @ts-ignore
    t.amount = Number(t.amount) || 0;
  }
  if (changed) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  return list;
}

// 2) 추가
export async function addTransaction(
  tx: Omit<Transaction, "id">
): Promise<Transaction> {
  const list = await listTransactions();
  const created: Transaction = { ...tx, id: crypto.randomUUID() };
  localStorage.setItem(KEY, JSON.stringify([created, ...list]));
  return created;
}

// 3) 삭제
export async function removeTransaction(id: string) {
  const list = await listTransactions(); // ← 마이그레이션 이후 데이터 사용
  const next = list.filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(next));
  return id;
}
