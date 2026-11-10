-- Group expense splitting tables (Phase 5: Groups & Splitting).
--
-- NOTE ON NAMING: the legacy, pre-Phase-4 schema already defines tables
-- named `groups` and `group_members` (see supabase/migrations/
-- 20241205132457_new-migration.sql / schema.sql lines ~154-172) with
-- SERIAL ids and a different column set (owner_id, expense_limit,
-- is_owner, ...). That legacy design was never wired up to any deployed
-- handler and predates the Dexie-mirroring `user_*` sync tables, but its
-- CREATE TABLE statements did run, so `groups`/`group_members` already
-- exist in the live database. To avoid colliding with those rows/columns,
-- this migration names the new "group" table `splitting_groups` and its
-- membership table `splitting_group_members` instead of reusing the
-- legacy names. `group_expenses` and `group_expense_shares` do not
-- collide with anything existing, so they keep the names used in the
-- feature spec. None of this is user-facing: the Cloud Function's JSON
-- API still exposes these as "groups" to the PWA client.
--
-- Same trust model as user_transactions etc. (backend/db/supabase/
-- migrations/20261110020000_pwa_sync_tables.sql): every row is only ever
-- read/written by the service-role-holding Cloud Function
-- (backend/services/user-service/functions), never by a client holding
-- just the anon/public key. RLS is enabled on all four tables with a
-- service-role-only policy, identical in shape to that migration's.

CREATE TABLE IF NOT EXISTS splitting_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS splitting_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES splitting_groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner','member')) DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ,
    UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES splitting_groups(id) ON DELETE CASCADE,
    paid_by INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS group_expense_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    share_amount INTEGER NOT NULL,
    is_settled BOOLEAN NOT NULL DEFAULT false,
    settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_splitting_group_members_user ON splitting_group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_splitting_group_members_group ON splitting_group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_expenses_group ON group_expenses (group_id);
CREATE INDEX IF NOT EXISTS idx_group_expense_shares_expense ON group_expense_shares (group_expense_id);
CREATE INDEX IF NOT EXISTS idx_group_expense_shares_user ON group_expense_shares (user_id);

-- Row Level Security: service role only, identical trust model and policy
-- shape to 20261110020000_pwa_sync_tables.sql. These tables are never
-- queried by anything holding just the anon/public key.
ALTER TABLE splitting_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE splitting_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_expense_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage splitting_groups" ON splitting_groups
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage splitting_group_members" ON splitting_group_members
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage group_expenses" ON group_expenses
    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage group_expense_shares" ON group_expense_shares
    FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE splitting_groups IS 'Phase 5 expense-splitting group (named splitting_groups, not groups, to avoid colliding with the legacy groups table from the pre-Phase-4 schema).';
COMMENT ON TABLE splitting_group_members IS 'Active/removed membership of a user in a splitting_groups group. removed_at set = soft-left/removed (self-leave or owner removal).';
COMMENT ON TABLE group_expenses IS 'An expense logged against a splitting_groups group, always paid by the authenticated caller who created it.';
COMMENT ON TABLE group_expense_shares IS 'One row per group member per group_expenses row: that member''s share of the expense, split evenly in integer cents with the remainder distributed to the lowest user_ids so shares always sum exactly to the expense amount.';
