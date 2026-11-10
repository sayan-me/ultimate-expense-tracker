"use client";

import { createContext, useContext, ReactNode, useEffect } from "react";
import { useTransactions, useAccounts, useCategories, useBudgets, useRecurringTransactions } from "@/hooks/use-db";
import { initializeDefaultData } from "@/lib/db-initialization";
import { useOfflineSyncStore } from "@/stores/offline-sync";

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

  // Initialize default data, catch up any recurring transactions that
  // fell due while the app was closed (lib/recurring.ts), then sync with
  // the cloud (stores/offline-sync.ts) — a no-op if no one's signed in.
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
      try {
        await useOfflineSyncStore.getState().syncNow();
      } catch (error) {
        console.error('❌ Failed to sync with the cloud:', error);
      }
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep isOnline current, and re-sync as soon as connectivity returns —
  // otherwise changes made while offline would only reach the cloud on
  // the next full app load. The store's own initial isOnline is always
  // true regardless of actual connectivity (see offline-sync.ts for why);
  // this corrects it to the real value right after mount, client-only.
  useEffect(() => {
    useOfflineSyncStore.getState().setOnline(navigator.onLine);

    const handleOnline = () => {
      useOfflineSyncStore.getState().setOnline(true);
      useOfflineSyncStore.getState().syncNow();
    };
    const handleOffline = () => useOfflineSyncStore.getState().setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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