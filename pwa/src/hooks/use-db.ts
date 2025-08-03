import { useLiveQuery } from "dexie-react-hooks";
import { db, type Transaction, type Account, type Category } from "@/lib/db";

export function useTransactions() {
  const transactions = useLiveQuery(() => db.transactions.orderBy('createdAt').reverse().toArray());
  
  const addTransaction = async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date();
    return await db.transactions.add({
      ...transaction,
      createdAt: now,
      updatedAt: now
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
    return useLiveQuery(() => 
      db.transactions.orderBy('createdAt').reverse().limit(limit).toArray()
    );
  };

  return {
    transactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    useTransactionsByAccount,
    useTransactionsByCategory,
    useRecentTransactions,
  };
}

export function useAccounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray());
  
  const addAccount = async (account: Omit<Account, "id" | "createdAt">) => {
    return await db.accounts.add({
      ...account,
      createdAt: new Date()
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
    return await db.accounts.update(id, changes);
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
  
  const addCategory = async (category: Omit<Category, "id" | "createdAt">) => {
    return await db.categories.add({
      ...category,
      createdAt: new Date()
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
    
    return await db.categories.update(id, changes);
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