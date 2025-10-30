import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTransactions, addTransaction } from "./api";
export * from "./types";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: listTransactions,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
    // 혹시 모를 캐시 꼬임까지 막으려면:
    onSettled: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}