import { useEffect, useState } from "react";
import { listTransactions, addTransaction, removeTransaction } from "./api";
import type { Transaction } from "./types";

export function useTransactions() {
  const [data, setData] = useState<Transaction[]>([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setData(await listTransactions());
      setLoading(false);
    })();
  }, []);

  async function add(tx: Omit<Transaction, "id">) {
    const created = await addTransaction(tx);
    // ✅ 같은 훅 인스턴스를 쓰는 컴포넌트들은 즉시 업데이트됨
    setData((cur) => [created, ...cur]);
  }

  async function remove(id: string) {
    await removeTransaction(id);
    setData((cur) => cur.filter((t) => t.id !== id));
  }

  return { data, isLoading, add, remove };
}
