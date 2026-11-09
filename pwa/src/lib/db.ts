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

    // Defensive read-side normalization: date fields are expected to be
    // real Date instances everywhere in this app (sort/format code calls
    // .getFullYear() etc. directly), but nothing guarantees that for
    // records that didn't come through this app's own write path — a
    // future import feature, or malformed data from another source. A
    // string/number date value crashed the whole dashboard with
    // "t.date.getFullYear is not a function" when tested; this keeps a
    // single bad record from taking down every other widget.
    // The hook fires even for a lookup that found nothing (obj is
    // undefined then) — db.transactions.get(missingId) relies on that
    // undefined passing through unchanged.
    this.transactions.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.date && !(obj.date instanceof Date)) obj.date = new Date(obj.date);
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      if (obj.updatedAt && !(obj.updatedAt instanceof Date)) obj.updatedAt = new Date(obj.updatedAt);
      return obj;
    });
    this.accounts.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      return obj;
    });
    this.categories.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      return obj;
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

// Methods like `transaction()` run with `this` bound to the Dexie instance
// internally, so they must be called on the real instance, not through the
// Proxy above (a method call through the Proxy would bind `this` to the
// Proxy itself). Use this for anything beyond simple table access.
export function getDb(): ExpenseTrackerDB {
  if (!_db) {
    _db = new ExpenseTrackerDB();
  }
  return _db;
}