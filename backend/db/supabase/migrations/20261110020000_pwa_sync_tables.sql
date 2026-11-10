-- Cloud sync tables for the PWA's local-only Dexie data (ROADMAP Phase 4).
--
-- These mirror the PWA's Dexie model field-for-field (integer cents, a
-- unified transactions ledger with transfer legs, free-text categories,
-- savings goals as account fields, recurring transactions with next-run
-- scheduling) rather than the older expenses/budgets/savings_goals tables
-- elsewhere in this schema, which predate that model and are not touched
-- by this migration.
--
-- sync_id is the bridge between a local Dexie row and its cloud row — the
-- PWA's own auto-increment `id` never leaves the device. user_id is always
-- taken server-side from the verified Firebase ID token, never trusted
-- from the client.
--
-- No row is ever queried by anything other than the service-role-holding
-- Cloud Function (backend/services/user-service/functions) — same trust
-- model as login_history. RLS is still enabled on every table (service
-- role only) so the public anon key — meant to be embeddable in client
-- code — can't read or write financial data even by mistake; RLS denies
-- by default once enabled, and the policy below is the only way through.

CREATE TABLE IF NOT EXISTS user_accounts (
    sync_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit', 'savings')),
    opening_balance INTEGER NOT NULL,
    is_default BOOLEAN,
    target_amount INTEGER,
    target_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_categories (
    sync_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'both')),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_transactions (
    sync_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_sync_id UUID NOT NULL REFERENCES user_accounts(sync_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer_out', 'transfer_in')),
    category TEXT NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    transfer_id UUID,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_budgets (
    sync_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT,
    amount INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_recurring_transactions (
    sync_id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_sync_id UUID NOT NULL REFERENCES user_accounts(sync_id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    category TEXT NOT NULL,
    description TEXT,
    amount INTEGER NOT NULL,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    start_date TIMESTAMPTZ NOT NULL,
    next_run_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- One (user_id, updated_at) index per table for the pull query's WHERE
-- user_id = ? AND updated_at > ? access pattern.
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_updated ON user_accounts (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_categories_user_updated ON user_categories (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_updated ON user_transactions (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_budgets_user_updated ON user_budgets (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_user_recurring_transactions_user_updated ON user_recurring_transactions (user_id, updated_at);

-- Row Level Security: service role only, identical trust model and policy
-- shape to login_history.sql. These tables are never queried by anything
-- holding just the anon/public key.
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_accounts" ON user_accounts
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_categories" ON user_categories
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_transactions" ON user_transactions
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_budgets" ON user_budgets
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage user_recurring_transactions" ON user_recurring_transactions
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE user_accounts IS 'Cloud mirror of the PWA''s local Dexie accounts table (Phase 4 sync).';
COMMENT ON TABLE user_categories IS 'Cloud mirror of the PWA''s local Dexie categories table (Phase 4 sync).';
COMMENT ON TABLE user_transactions IS 'Cloud mirror of the PWA''s local Dexie transactions table (Phase 4 sync). type includes transfer_out/transfer_in legs, linked by transfer_id.';
COMMENT ON TABLE user_budgets IS 'Cloud mirror of the PWA''s local Dexie budgets table (Phase 4 sync). category NULL = the overall monthly budget.';
COMMENT ON TABLE user_recurring_transactions IS 'Cloud mirror of the PWA''s local Dexie recurringTransactions table (Phase 4 sync).';
COMMENT ON COLUMN user_accounts.sync_id IS 'Bridges a local Dexie row to its cloud row; the PWA''s own auto-increment id never leaves the device.';
