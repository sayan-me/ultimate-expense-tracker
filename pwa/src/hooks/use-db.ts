import { useLiveQuery } from "dexie-react-hooks";
import { db, type Transaction, type Account } from "@/lib/db";

export function useTransactions() {
  const transactions = useLiveQuery(() => db.transactions.toArray());
  
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    return await db.transactions.add(transaction);
  };

  const deleteTransaction = async (id: number) => {
    return await db.transactions.delete(id);
  };

  const updateTransaction = async (id: number, changes: Partial<Transaction>) => {
    return await db.transactions.update(id, changes);
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
  };
}

export function useAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray());
  
  const addAccount = async (account: Omit<Account, "id">) => {
    return await db.accounts.add(account);
  };

  const deleteAccount = async (id: number) => {
    return await db.accounts.delete(id);
  };

  const updateAccount = async (id: number, changes: Partial<Account>) => {
    return await db.accounts.update(id, changes);
  };

  return {
    accounts,
    addAccount,
    deleteAccount,
    updateAccount,
  };
} 