"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useTransactions, useAccounts, useCategories, useBudgets, useRecurringTransactions } from "@/hooks/use-db";
import { initializeDefaultData } from "@/lib/db-initialization";

type DBContextType = {
  transactions: ReturnType<typeof useTransactions>;
  accounts: ReturnType<typeof useAccounts>;
  categories: ReturnType<typeof useCategories>;
  budgets: ReturnType<typeof useBudgets>;
  recurring: ReturnType<typeof useRecurringTransactions>;
};

const DBContext = createContext<DBContextType | undefined>(undefined);

export function DBProvider({ children }: { children: ReactNode }) {
  const transactions = useTransactions();
  const accounts = useAccounts();
  const categories = useCategories();
  const budgets = useBudgets();
  const recurring = useRecurringTransactions();

  // Initialize default data, then catch up any recurring transactions
  // that fell due while the app was closed (lib/recurring.ts).
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeDefaultData();
      } catch (error) {
        console.error('❌ Failed to initialize default data:', error);
      }
      try {
        await recurring.runDueRecurringTransactions();
      } catch (error) {
        console.error('❌ Failed to run due recurring transactions:', error);
      }
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DBContext.Provider value={{ transactions, accounts, categories, budgets, recurring }}>
      {children}
    </DBContext.Provider>
  );
}

export function useDB() {
  const context = useContext(DBContext);
  if (context === undefined) {
    throw new Error("useDB must be used within a DBProvider");
  }
  return context;
} 