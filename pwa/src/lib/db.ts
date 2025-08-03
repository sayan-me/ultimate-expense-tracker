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
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id?: number;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'savings';
  balance: number;
  isDefault?: boolean;
  createdAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  type: 'expense' | 'income' | 'both';
  createdAt: Date;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  categories!: Table<Category>;

  constructor() {
    super('ExpenseTrackerDB');
    
    // Version 1: Original schema
    this.version(1).stores({
      transactions: '++id, type, category, date, accountId',
      accounts: '++id, name, type'
    });

    // Version 2: Enhanced schema with categories and timestamps
    this.version(2).stores({
      transactions: '++id, type, category, date, accountId, amount, createdAt',
      accounts: '++id, name, type, balance, isDefault',
      categories: '++id, name, type, isDefault'
    }).upgrade(trans => {
      // Add timestamps to existing records
      return trans.table('transactions').toCollection().modify(transaction => {
        transaction.createdAt = transaction.date || new Date();
        transaction.updatedAt = transaction.date || new Date();
      }).then(() => {
        return trans.table('accounts').toCollection().modify(account => {
          account.createdAt = new Date();
        });
      });
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