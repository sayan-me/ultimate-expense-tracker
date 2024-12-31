import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Transaction {
  id?: number;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  date: Date;
  accountId: number;
}

export interface Account {
  id?: number;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings';
  balance: number;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;

  constructor() {
    super('ExpenseTrackerDB');
    this.version(1).stores({
      transactions: '++id, type, category, date, accountId',
      accounts: '++id, name, type'
    });
  }
}

export const db = new ExpenseTrackerDB(); 