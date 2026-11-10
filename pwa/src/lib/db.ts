import Dexie, { Table } from 'dexie';

// Define types for our database tables
export interface Transaction {
  id?: number;
  /** Integer cents, not dollars — see src/lib/money.ts. */
  amount: number;
  /**
   * transfer_out/transfer_in are a linked pair (same transferId) moving
   * money between two of the user's own accounts — they behave like an
   * expense/income for balance purposes (src/lib/account-balance.ts) but
   * are excluded from spend/budget tracking (src/lib/budget.ts), since
   * moving money to savings isn't "spending" it.
   */
  type: 'expense' | 'income' | 'transfer_out' | 'transfer_in';
  category: string;
  description: string;
  date: Date;
  accountId: number;
  /** Links a transfer's two legs together. Unset for ordinary expense/income. */
  transferId?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  /**
   * Cloud-sync identity (ROADMAP Phase 4) — a UUID bridging this row to its
   * cloud counterpart; the local auto-increment `id` never leaves the
   * device. Optional on the TS type (backfilled for existing rows by the
   * v6 migration, set by the write-path hooks for new ones) so this stays
   * additive rather than forcing every existing test fixture to supply it.
   */
  syncId?: string;
}

/** A transfer leg is never edited through the ordinary expense/income form (AddExpenseForm/AddExpenseModal) — this narrows for that boundary. */
export function isExpenseOrIncomeTransaction(
  t: Transaction
): t is Transaction & { type: 'expense' | 'income' } {
  return t.type === 'expense' || t.type === 'income';
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
  /**
   * Savings goals (ROADMAP Phase 3) are a 'savings' account with a
   * target: progress is just this account's derived balance against
   * targetAmount, contributed to via ordinary transfers — no separate
   * goal ledger. Both are undefined for a regular (non-goal) account.
   */
  targetAmount?: number;
  targetDate?: Date;
  createdAt: Date;
  /** Added in v6 for cloud sync's last-write-wins comparison — see Transaction.updatedAt above for why it's optional on new rows but always backfilled. */
  updatedAt?: Date;
  /** See Transaction.syncId. */
  syncId?: string;
}

export interface RecurringTransaction {
  id?: number;
  accountId: number;
  type: 'expense' | 'income';
  category: string;
  description: string;
  /** Integer cents, not dollars — see src/lib/money.ts. */
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  /** The first occurrence; never changes after creation. */
  startDate: Date;
  /** The next occurrence still to be materialized into a real transaction. */
  nextRunDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** See Transaction.syncId. */
  syncId?: string;
}

export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  type: 'expense' | 'income' | 'both';
  createdAt: Date;
  /** See Account.updatedAt. */
  updatedAt?: Date;
  /** See Transaction.syncId. */
  syncId?: string;
}

export interface Budget {
  id?: number;
  /** null = the overall monthly budget across every category. */
  category: string | null;
  /** Integer cents, not dollars — see src/lib/money.ts. */
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  /** See Transaction.syncId. */
  syncId?: string;
}

export class ExpenseTrackerDB extends Dexie {
  transactions!: Table<Transaction>;
  accounts!: Table<Account>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;

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

    // Version 5: adds recurringTransactions (ROADMAP Phase 3) — purely
    // additive. Transfers (also Phase 3) and savings goals reuse the
    // existing transactions/accounts tables via new, non-indexed fields
    // (transferId, targetAmount, targetDate), which Dexie doesn't need a
    // schema bump for.
    this.version(5).stores({
      transactions: '++id, type, category, date, accountId, amount, createdAt',
      accounts: '++id, name, type, openingBalance, isDefault',
      categories: '++id, name, type, isDefault',
      budgets: '++id, category',
      recurringTransactions: '++id, accountId, nextRunDate, isActive',
    });

    // Version 6: adds syncId (ROADMAP Phase 4 cloud sync) to every synced
    // table, plus updatedAt on accounts/categories (new there — needed so
    // every synced table has a last-write-wins timestamp to compare, not
    // just the ones that already tracked it). Every existing row is
    // backfilled: a fresh syncId per row (never share one across rows —
    // each is a distinct cloud identity), and updatedAt defaulting to the
    // row's own createdAt where it didn't exist yet. New rows get their
    // syncId from the write-path hooks (use-db.ts), not this backfill.
    this.version(6).stores({
      transactions: '++id, type, category, date, accountId, amount, createdAt, syncId',
      accounts: '++id, name, type, openingBalance, isDefault, syncId',
      categories: '++id, name, type, isDefault, syncId',
      budgets: '++id, category, syncId',
      recurringTransactions: '++id, accountId, nextRunDate, isActive, syncId',
    }).upgrade(async (trans) => {
      for (const tableName of ['transactions', 'accounts', 'categories', 'budgets', 'recurringTransactions']) {
        await trans.table(tableName).toCollection().modify((row) => {
          if (!row.syncId) row.syncId = crypto.randomUUID();
        });
      }
      await trans.table('accounts').toCollection().modify((a) => {
        if (!a.updatedAt) a.updatedAt = a.createdAt;
      });
      await trans.table('categories').toCollection().modify((c) => {
        if (!c.updatedAt) c.updatedAt = c.createdAt;
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
      if (obj.updatedAt && !(obj.updatedAt instanceof Date)) obj.updatedAt = new Date(obj.updatedAt);
      if (obj.targetDate && !(obj.targetDate instanceof Date)) obj.targetDate = new Date(obj.targetDate);
      return obj;
    });
    this.categories.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      if (obj.updatedAt && !(obj.updatedAt instanceof Date)) obj.updatedAt = new Date(obj.updatedAt);
      return obj;
    });
    this.budgets.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.createdAt && !(obj.createdAt instanceof Date)) obj.createdAt = new Date(obj.createdAt);
      if (obj.updatedAt && !(obj.updatedAt instanceof Date)) obj.updatedAt = new Date(obj.updatedAt);
      return obj;
    });
    this.recurringTransactions.hook('reading', (obj) => {
      if (!obj) return obj;
      if (obj.startDate && !(obj.startDate instanceof Date)) obj.startDate = new Date(obj.startDate);
      if (obj.nextRunDate && !(obj.nextRunDate instanceof Date)) obj.nextRunDate = new Date(obj.nextRunDate);
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