export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  date: string;      // YYYY-MM-DD
  category: string;
  memo?: string;
  amount: number;    // 양수
  type: TransactionType;
}
