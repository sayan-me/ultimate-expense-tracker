"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useTransactions, useAccounts, useCategories } from "@/hooks/use-db";
import { initializeDefaultData } from "@/lib/db-initialization";

type DBContextType = {
  transactions: ReturnType<typeof useTransactions>;
  accounts: ReturnType<typeof useAccounts>;
  categories: ReturnType<typeof useCategories>;
};

const DBContext = createContext<DBContextType | undefined>(undefined);

export function DBProvider({ children }: { children: ReactNode }) {
  const transactions = useTransactions();
  const accounts = useAccounts();
  const categories = useCategories();

  // Initialize default data on first load
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeDefaultData();
      } catch (error) {
        console.error('Failed to initialize default data:', error);
      }
    };

    initData();
  }, []);

  return (
    <DBContext.Provider value={{ transactions, accounts, categories }}>
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