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

// Lazy initialization for SSR compatibility
let _db: ExpenseTrackerDB | null = null;

export const db = new Proxy({} as ExpenseTrackerDB, {
  get(target, prop: keyof ExpenseTrackerDB) {
    if (!_db && typeof window !== 'undefined') {
      _db = new ExpenseTrackerDB();
    }
    return _db ? _db[prop] : undefined;
  }
}); 