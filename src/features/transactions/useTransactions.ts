import { useEffect, useState } from "react";
import { listTransactions, addTransaction, removeTransaction } from "./api";
import type { Transaction } from "./types";

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setLoading] = useState(true);

  // ✅ refetch: localStorage에서 다시 읽어오는 함수
  const refetch = async () => {
    setLoading(true);
    const list = await listTransactions();
    setData(list);
    setLoading(false);
  };

  useEffect(() => {
    refetch();
  }, []);

  async function add(tx: Omit<Transaction, "id">) {
    const created = await addTransaction(tx);
    // 즉시 반영 (옵션): setData(cur => [created, ...cur]);
    // 안전하게: 저장 후 refetch로 동기화
    await refetch();
    return created;
  }

  async function remove(id: string) {
    await removeTransaction(id);
    setData(cur => cur.filter(t => t.id !== id));
  }

  return { data, isLoading, add, remove, refetch };
}
