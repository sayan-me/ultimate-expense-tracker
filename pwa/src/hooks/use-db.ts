import { useLiveQuery } from "dexie-react-hooks";
import { db, getDb, type Transaction, type Account, type Category, type RecurringTransaction } from "@/lib/db";
import { materializeDueRecurring } from "@/lib/recurring";

export function useTransactions() {
  const transactions = useLiveQuery(() => db.transactions.orderBy('createdAt').reverse().toArray());

  // Account balances are derived from openingBalance + the account's own
  // transactions (src/lib/account-balance.ts), not stored and mutated
  // here — so, unlike before, these are now plain single-table writes
  // with nothing else to keep in sync.
  const addTransaction = async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "syncId">) => {
    const now = new Date();
    return await db.transactions.add({
      ...transaction,
      createdAt: now,
      updatedAt: now,
      syncId: crypto.randomUUID(),
    });
  };

  const deleteTransaction = async (id: number) => {
    return await db.transactions.delete(id);
  };

  const updateTransaction = async (id: number, changes: Partial<Transaction>) => {
    return await db.transactions.update(id, {
      ...changes,
      updatedAt: new Date()
    });
  };

  // A transfer is two ordinary transactions (transfer_out on the source
  // account, transfer_in on the destination) sharing one transferId, written
  // in a single Dexie transaction so they can never exist as a lone,
  // unbalanced leg. Dexie's own transaction() must run on the real instance
  // (getDb()), not the lazy-init Proxy exported as `db` — see lib/db.ts.
  const createTransfer = async (transfer: {
    fromAccountId: number
    toAccountId: number
    amount: number
    date: Date
    description: string
  }) => {
    const { fromAccountId, toAccountId, amount, date, description } = transfer
    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account")
    }
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive")
    }

    const transferId = crypto.randomUUID()
    const now = new Date()
    const base = { category: "Transfer", description, date, transferId, createdAt: now, updatedAt: now }

    return getDb().transaction("rw", "transactions", async () => {
      await db.transactions.add({ ...base, type: "transfer_out", amount, accountId: fromAccountId, syncId: crypto.randomUUID() })
      await db.transactions.add({ ...base, type: "transfer_in", amount, accountId: toAccountId, syncId: crypto.randomUUID() })
    })
  }

  const useTransactionsByAccount = (accountId: number) => {
    return useLiveQuery(async () => {
      const results = await db.transactions.where('accountId').equals(accountId).toArray();
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  };

  const useTransactionsByCategory = (category: string) => {
    return useLiveQuery(async () => {
      const results = await db.transactions.where('category').equals(category).toArray();
      return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  };

  const useRecentTransactions = (limit: number = 10) => {
    // Sorted by the transaction's own date, not when it was entered
    // (U6 in the bug report — createdAt put a backfilled Nov 7 expense
    // above same-day Nov 8 ones). createdAt breaks ties.
    return useLiveQuery(async () => {
      const all = await db.transactions.toArray();
      return all
        .sort((a, b) => b.date.getTime() - a.date.getTime() || b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);
    });
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    createTransfer,
    useTransactionsByAccount,
    useTransactionsByCategory,
    useRecentTransactions,
  };
}

export function useAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray());
  
  const addAccount = async (account: Omit<Account, "id" | "createdAt" | "updatedAt" | "syncId">) => {
    const now = new Date();
    return await db.accounts.add({
      ...account,
      createdAt: now,
      updatedAt: now,
      syncId: crypto.randomUUID(),
    });
  };

  const deleteAccount = async (id: number) => {
    // Check if this is the default account
    const account = await db.accounts.get(id);
    if (account?.isDefault) {
      throw new Error('Cannot delete the default account');
    }
    
    // Check if any transactions use this account
    const transactionsCount = await db.transactions.where('accountId').equals(id).count();
    if (transactionsCount > 0) {
      throw new Error(`Cannot delete account - it has ${transactionsCount} transaction(s)`);
    }
    
    return await db.accounts.delete(id);
  };

  const updateAccount = async (id: number, changes: Partial<Account>) => {
    return await db.accounts.update(id, { ...changes, updatedAt: new Date() });
  };

  const useDefaultAccount = () => {
    return useLiveQuery(async () => {
      const accounts = await db.accounts.toArray();
      return accounts.find(account => account.isDefault === true);
    });
  };

  return {
    accounts,
    addAccount,
    deleteAccount,
    updateAccount,
    useDefaultAccount,
  };
}

export function useCategories() {
  const categories = useLiveQuery(() => db.categories.toArray());
  
  const addCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt" | "syncId">) => {
    const now = new Date();
    return await db.categories.add({
      ...category,
      createdAt: now,
      updatedAt: now,
      syncId: crypto.randomUUID(),
    });
  };

  const deleteCategory = async (id: number) => {
    const category = await db.categories.get(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    if (category.isDefault) {
      throw new Error('Cannot delete default categories');
    }
    
    // Check if any transactions use this category
    const transactionsCount = await db.transactions.where('category').equals(category.name).count();
    if (transactionsCount > 0) {
      throw new Error(`Cannot delete category "${category.name}" - it is used by ${transactionsCount} transaction(s)`);
    }
    
    return await db.categories.delete(id);
  };

  const updateCategory = async (id: number, changes: Partial<Category>) => {
    const category = await db.categories.get(id);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    if (category.isDefault) {
      throw new Error('Cannot update default categories');
    }
    
    return await db.categories.update(id, { ...changes, updatedAt: new Date() });
  };

  const useCategoriesByType = (type: 'expense' | 'income' | 'both') => {
    return useLiveQuery(() => {
      if (type === 'both') {
        return db.categories.toArray();
      }
      return db.categories.where('type').equals(type).toArray();
    });
  };

  return {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    useCategoriesByType,
  };
}

export function useBudgets() {
  const budgets = useLiveQuery(() => db.budgets.toArray());

  // Upsert: a category (or the overall budget, category === null) has at
  // most one budget row. Without this, repeatedly setting the same
  // category's budget would pile up duplicate rows instead of replacing
  // the old amount.
  const setBudget = async (category: string | null, amount: number) => {
    const existing = (await db.budgets.toArray()).find((b) => b.category === category);
    const now = new Date();
    if (existing?.id !== undefined) {
      await db.budgets.update(existing.id, { amount, updatedAt: now });
      return existing.id;
    }
    return await db.budgets.add({ category, amount, createdAt: now, updatedAt: now, syncId: crypto.randomUUID() });
  };

  const deleteBudget = async (id: number) => {
    return await db.budgets.delete(id);
  };

  const useOverallBudget = () => {
    return useLiveQuery(async () => {
      const all = await db.budgets.toArray();
      return all.find((b) => b.category === null);
    });
  };

  const useCategoryBudget = (category: string) => {
    return useLiveQuery(async () => {
      const all = await db.budgets.toArray();
      return all.find((b) => b.category === category);
    }, [category]);
  };

  return {
    budgets,
    setBudget,
    deleteBudget,
    useOverallBudget,
    useCategoryBudget,
  };
}

export function useRecurringTransactions() {
  const recurringTransactions = useLiveQuery(() => db.recurringTransactions.toArray());

  const addRecurring = async (recurring: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt" | "syncId">) => {
    const now = new Date();
    return await db.recurringTransactions.add({ ...recurring, createdAt: now, updatedAt: now, syncId: crypto.randomUUID() });
  };

  const updateRecurring = async (id: number, changes: Partial<RecurringTransaction>) => {
    return await db.recurringTransactions.update(id, { ...changes, updatedAt: new Date() });
  };

  const deleteRecurring = async (id: number) => {
    return await db.recurringTransactions.delete(id);
  };

  // Materializes every active recurring transaction's overdue occurrences
  // (lib/recurring.ts) into real transaction rows, advancing each one's
  // nextRunDate past what it just produced — one Dexie transaction per
  // recurring item so a row's new transactions and its advanced
  // nextRunDate always land together.
  const runDueRecurringTransactions = async (asOf: Date = new Date()) => {
    const all = await db.recurringTransactions.toArray();
    for (const recurring of all) {
      const { transactions, nextRunDate } = materializeDueRecurring(recurring, asOf)
      if (transactions.length === 0) continue
      await getDb().transaction("rw", ["transactions", "recurringTransactions"], async () => {
        const now = new Date()
        for (const t of transactions) {
          await db.transactions.add({ ...t, createdAt: now, updatedAt: now })
        }
        await db.recurringTransactions.update(recurring.id!, { nextRunDate, updatedAt: now })
      })
    }
  };

  return {
    recurringTransactions,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    runDueRecurringTransactions,
  };
}
