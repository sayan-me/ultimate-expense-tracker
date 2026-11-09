import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Transaction {
  id?: number;
  /** Integer cents, not dollars — see src/lib/money.ts. */
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
  /**
   * Integer cents, not dollars — see src/lib/money.ts. This is a fixed
   * starting point set at account creation, not the account's current
   * balance: the current balance is openingBalance plus the sum of the
   * account's own transactions (src/lib/account-balance.ts), derived on
   * read rather than stored and mutated on every transaction write.
   */
  openingBalance: number;
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

export interface Budget {
  id?: number;
  /** null = the overall monthly budget across every category. */
  category: string | null;
  /** Integer cents, not dollars — see src/lib/money.ts. */
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;

  constructor(name: string = 'ExpenseTrackerDB') {
    super(name);

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

    // Version 3: money moves from float dollars to integer cents, and
    // accounts.balance (a live, continuously-updated current balance)
    // becomes accounts.openingBalance (a fixed starting point — the
    // current balance is now derived on read, see account-balance.ts).
    //
    // openingBalance is NOT just the old balance converted to cents: a
    // user's existing balance already reflects every transaction that
    // led to it, so copying it straight over would double-count all of
    // them once openingBalance + transactions is derived afterward.
    // Instead it's reverse-derived as (old balance − net of the
    // account's existing transactions), so that deriving the balance
    // post-migration reproduces the exact same figure the user had
    // the moment before this migration ran.
    this.version(3).stores({
      transactions: '++id, type, category, date, accountId, amount, createdAt',
      accounts: '++id, name, type, openingBalance, isDefault',
      categories: '++id, name, type, isDefault'
    }).upgrade(async (trans) => {
      await trans.table('transactions').toCollection().modify((t) => {
        t.amount = Math.round(t.amount * 100);
      });

      const transactions = await trans.table('transactions').toArray();
      const netCentsByAccount = new Map<number, number>();
      for (const t of transactions) {
        const signed = t.type === 'income' ? t.amount : -t.amount;
        netCentsByAccount.set(t.accountId, (netCentsByAccount.get(t.accountId) ?? 0) + signed);
      }

      await trans.table('accounts').toCollection().modify((a) => {
        const oldBalanceCents = Math.round(a.balance * 100);
        const net = netCentsByAccount.get(a.id) ?? 0;
        a.openingBalance = oldBalanceCents - net;
        delete a.balance;
      });
    });

    // Version 4: adds budgets (ROADMAP Phase 2) — purely additive, no
    // existing data to transform.
    this.version(4).stores({
      transactions: '++id, type, category, date, accountId, amount, createdAt',
      accounts: '++id, name, type, openingBalance, isDefault',
      categories: '++id, name, type, isDefault',
      budgets: '++id, category',
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
    this.budgets.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      if (obj.updatedAt && !(obj.updatedAt instanceof Date)) obj.updatedAt = new Date(obj.updatedAt);
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