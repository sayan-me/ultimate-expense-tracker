"use client";

import { createContext, useContext, ReactNode } from "react";
import { useTransactions, useAccounts } from "@/hooks/use-db";

type DBContextType = {
  transactions: ReturnType<typeof useTransactions>;
  accounts: ReturnType<typeof useAccounts>;
};

const DBContext = createContext<DBContextType | undefined>(undefined);

export function DBProvider({ children }: { children: ReactNode }) {
  const transactions = useTransactions();
  const accounts = useAccounts();

  return (
    <DBContext.Provider value={{ transactions, accounts }}>
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