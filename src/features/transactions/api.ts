import type { Transaction } from "./types";

const KEY = "tx";

export async function listTransactions(): Promise<Transaction[]> {
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Transaction[]) : [];
}

export async function addTransaction(
  tx: Omit<Transaction, "id">
): Promise<Transaction> {
  const list = await listTransactions();
  const created: Transaction = { ...tx, id: crypto.randomUUID() };
  localStorage.setItem(KEY, JSON.stringify([created, ...list]));
  return created;
}
