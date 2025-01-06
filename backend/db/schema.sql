-- Core tables for expense tracking

-- Users table (for future authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_id VARCHAR(128) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id), -- NULL for default categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_name_per_user UNIQUE (name, user_id)
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    user_id INTEGER REFERENCES users(id), -- NULL for default tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tag_name_per_user UNIQUE (name, user_id)
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100),
    bank_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Virtual accounts table
CREATE TABLE virtual_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    balance DECIMAL(12,2) DEFAULT 0.00,
    account_type VARCHAR(20) NOT NULL, -- 'savings' or 'loan'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_account_type CHECK (account_type IN ('savings', 'loan')),
    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- Index for virtual_accounts
CREATE INDEX idx_virtual_accounts_id_account_type ON virtual_accounts(id, account_type);

-- Parameterized Trigger Function to validate virtual account id with account type as parameter
CREATE OR REPLACE FUNCTION check_valid_account()
RETURNS TRIGGER AS $$
DECLARE
    account_type_param TEXT;
BEGIN
    -- Determine the account type from the trigger context
    IF TG_TABLE_NAME = 'loan_installments' THEN
        account_type_param := 'loan';
    ELSIF TG_TABLE_NAME = 'savings_goals' THEN
        account_type_param := 'savings';
    ELSE
        RAISE EXCEPTION 'Invalid table for account validation';
    END IF;
    -- Validate the new virtual account id with the appropriate account type
    IF NOT EXISTS (
        SELECT 1 FROM virtual_accounts 
        WHERE id = NEW.virtual_account_id 
        AND account_type = account_type_param
    ) THEN
        RAISE EXCEPTION 'Invalid virtual account for % account', account_type_param;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Loan installments table
CREATE TABLE loan_installments (
    id SERIAL PRIMARY KEY,
    virtual_account_id INTEGER REFERENCES virtual_accounts(id),
    amount DECIMAL(12,2) NOT NULL,
    due_date DATE NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_reference TEXT,
    reminder_days INTEGER DEFAULT 5, -- Days before due date to start reminding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_installment_amount CHECK (amount > 0),
    CONSTRAINT valid_reminder_days CHECK (reminder_days > 0)
);

-- Triggers
CREATE TRIGGER validate_loan_account
BEFORE INSERT OR UPDATE ON loan_installments
FOR EACH ROW EXECUTE FUNCTION check_valid_account();

-- Virtual to Bank account mapping
CREATE TABLE virtual_bank_mappings (
    id SERIAL PRIMARY KEY,
    virtual_account_id INTEGER REFERENCES virtual_accounts(id),
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (virtual_account_id, bank_account_id)
);

-- Expenses table
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    merchant_name VARCHAR(100),
    virtual_account_id INTEGER REFERENCES virtual_accounts(id),
    category_id INTEGER REFERENCES categories(id),
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recurring_end_date DATE,
    last_occurrence_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT valid_expense_date CHECK (date <= CURRENT_TIMESTAMP),
    CONSTRAINT valid_recurring_frequency CHECK (
        CASE 
            WHEN is_recurring THEN recurring_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')
            ELSE recurring_frequency IS NULL
        END
    )
);

-- Expense tags mapping
CREATE TABLE expense_tags (
    expense_id INTEGER REFERENCES expenses(id),
    tag_id INTEGER REFERENCES tags(id),
    PRIMARY KEY (expense_id, tag_id)
);

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id),
    expense_limit DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Group members table
CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id),
    user_id INTEGER REFERENCES users(id),
    is_owner BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, user_id)
);

-- Budgets table
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    group_id INTEGER REFERENCES groups(id), -- NULL for personal budgets
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_budget_dates CHECK (end_date > start_date),
    CONSTRAINT positive_budget_amount CHECK (amount > 0),
    current_spend DECIMAL(12,2) DEFAULT 0.00,
    warning_threshold DECIMAL(5,2) DEFAULT 80.00,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT valid_warning_threshold CHECK (warning_threshold BETWEEN 0 AND 100),
    CONSTRAINT valid_current_spend CHECK (current_spend >= 0)
);

-- Split expenses table
CREATE TABLE split_expenses (
    id SERIAL PRIMARY KEY,
    expense_id INTEGER REFERENCES expenses(id),
    group_id INTEGER REFERENCES groups(id),
    created_by_user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    split_type VARCHAR(20) NOT NULL, -- 'EQUAL', 'PERCENTAGE', 'CUSTOM'
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    approval_required BOOLEAN DEFAULT false,
    approved_by_user_id INTEGER REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_split_type CHECK (split_type IN ('EQUAL', 'PERCENTAGE', 'CUSTOM')),
    CONSTRAINT valid_split_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT positive_split_amount CHECK (amount > 0)
);

-- Split expense shares table
CREATE TABLE split_expense_shares (
    id SERIAL PRIMARY KEY,
    split_expense_id INTEGER REFERENCES split_expenses(id),
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2) NOT NULL,
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PAID'
    settlement_date TIMESTAMP WITH TIME ZONE,
    settlement_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_share_status CHECK (status IN ('PENDING', 'PAID')),
    CONSTRAINT positive_share_amount CHECK (amount > 0)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_notification_type CHECK (
        type IN (
            -- Split expense related
            'SPLIT_APPROVAL_REQUEST',   -- When member requests split approval
            'SPLIT_APPROVED',          -- When split is approved
            'SPLIT_REJECTED',          -- When split is rejected
            
            -- Budget related
            'BUDGET_LIMIT_APPROACHING', -- When nearing budget limit (e.g., 80%)
            'BUDGET_LIMIT_EXCEEDED',    -- When budget is exceeded
            'BUDGET_PERIOD_ENDING',     -- Reminder before budget period ends
            
            -- Recurring expenses
            'RECURRING_EXPENSE_DUE',    -- Reminder for upcoming recurring expense
            'RECURRING_EXPENSE_OVERDUE', -- Missed recurring expense
            
            -- Group related
            'GROUP_INVITE',            -- When invited to a group
            'GROUP_MEMBER_JOINED',     -- When new member joins
            'GROUP_MEMBER_LEFT',       -- When member leaves
            'GROUP_BUDGET_UPDATED',    -- When group owner updates budget
            'GROUP_ROLE_CHANGED',      -- When member's role changes
            
            -- Virtual account related
            'LOW_BALANCE_WARNING',     -- When balance falls below threshold
            'SAVINGS_GOAL_ACHIEVED',   -- When savings target is met
            
            -- Loan installment related
            'LOAN_INSTALLMENT_UPCOMING',   -- When installment due date is approaching
            'LOAN_INSTALLMENT_DUE_TODAY',  -- When installment is due today
            'LOAN_INSTALLMENT_OVERDUE',    -- When installment is past due date
            'LOAN_INSTALLMENT_PAID',       -- When installment is marked as paid

            -- System related
            'SYSTEM_MAINTENANCE',          -- For planned maintenance or updates
            'APP_UPDATE_AVAILABLE',        -- New app version available
            'FEATURE_ANNOUNCEMENT',        -- New feature releases
            'SECURITY_ALERT',             -- Security-related notifications
            
            -- Data processing related
            'ACCOUNT_ACTIVITY',           -- General account activity alerts
            'DATA_SYNC_COMPLETE',         -- When bank statement import/sync completes
            'EXPORT_READY',               -- When data export is ready for download
            'RECEIPT_SCAN_COMPLETE',      -- When receipt scanning is complete
            'ML_SUGGESTION_AVAILABLE',    -- When new ML-based suggestions are available

            -- Generic/Other notifications
            'OTHER'                       -- For future notification types
        )
    ),
    CONSTRAINT valid_reference_type CHECK (
        reference_type IN (
            'SPLIT_EXPENSE',
            'GROUP',
            'BUDGET',
            'EXPENSE',
            'VIRTUAL_ACCOUNT',
            'LOAN_INSTALLMENT',
            'SYSTEM',                     -- Added for system-related notifications
            'DATA_EXPORT',                -- Added for export notifications
            'RECEIPT_SCAN',               -- Added for receipt scan notifications
            'ML_SUGGESTION'               -- Added for ML-based suggestions
        )
    )
);

-- Bank statement imports
CREATE TABLE bank_statement_imports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    bank_account_id INTEGER REFERENCES bank_accounts(id),
    file_name VARCHAR(255),
    import_status VARCHAR(20),
    processed_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_import_status CHECK (
        import_status IN ('PROCESSING', 'COMPLETED', 'FAILED')
    )
);

-- Bank statement transactions
CREATE TABLE bank_statement_transactions (
    id SERIAL PRIMARY KEY,
    import_id INTEGER REFERENCES bank_statement_imports(id),
    transaction_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    amount DECIMAL(12,2),
    transaction_type VARCHAR(20),
    is_matched BOOLEAN DEFAULT false,
    matched_expense_id INTEGER REFERENCES expenses(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_transaction_type CHECK (
        transaction_type IN ('CREDIT', 'DEBIT')
    ),
    balance_after_transaction DECIMAL(12,2),
    transaction_reference VARCHAR(100)
);

-- Add indexes for better performance
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_split_expenses_group ON split_expenses(group_id);
CREATE INDEX idx_split_expenses_creator ON split_expenses(created_by_user_id);
CREATE INDEX idx_budgets_dates ON budgets(start_date, end_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_virtual_accounts_user ON virtual_accounts(user_id);


-- Add index for loan installments
CREATE INDEX idx_loan_installments_due_date ON loan_installments(due_date);
CREATE INDEX idx_loan_installments_account ON loan_installments(virtual_account_id);

-- Add index for active budgets
CREATE INDEX idx_active_budgets ON budgets(is_active) WHERE is_active = true;

-- Awards table
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_award_type CHECK (
        type IN ('BUDGET_ADHERENCE', 'SAVINGS_GOAL', 'GROUP_ACHIEVEMENT')
    )
);

-- User awards table
CREATE TABLE user_awards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    award_id INTEGER REFERENCES awards(id),
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reference_id INTEGER NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    CONSTRAINT valid_award_reference CHECK (
        reference_type IN ('BUDGET', 'SAVINGS_GOAL', 'GROUP')
    )
);

CREATE INDEX idx_user_awards ON user_awards(user_id, award_id);

CREATE TABLE expense_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(12,2),
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    merchant_name VARCHAR(100),
    confidence_score DECIMAL(5,2),
    source VARCHAR(50) NOT NULL,
    is_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT valid_suggestion_source CHECK (
        source IN ('SMS', 'LOCATION', 'PATTERN', 'RECURRING')
    ),
    CONSTRAINT valid_confidence_score CHECK (
        confidence_score BETWEEN 0 AND 100
    )
);

CREATE INDEX idx_pending_suggestions ON expense_suggestions(user_id, expires_at) 
WHERE NOT is_applied;

CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    push_notifications_enabled BOOLEAN DEFAULT true,
    expense_reminder_frequency VARCHAR(20),
    expense_reminder_time TIME,
    theme_preference VARCHAR(20) DEFAULT 'DARK',
    currency_code VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_reminder_frequency CHECK (
        expense_reminder_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER')
    ),
    CONSTRAINT valid_theme CHECK (
        theme_preference IN ('DARK', 'LIGHT', 'SYSTEM')
    )
);

CREATE TABLE receipt_scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    image_url TEXT NOT NULL,
    scan_status VARCHAR(20) NOT NULL,
    extracted_data JSONB,
    created_expense_id INTEGER REFERENCES expenses(id),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_scan_status CHECK (
        scan_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
    )
);

CREATE INDEX idx_pending_scans ON receipt_scans(scan_status) 
WHERE scan_status IN ('PENDING', 'PROCESSING');

CREATE TABLE savings_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    virtual_account_id INTEGER REFERENCES virtual_accounts(id),
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0.00,
    target_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_goal_amounts CHECK (
        target_amount > 0 AND current_amount >= 0
    ),
    CONSTRAINT valid_goal_status CHECK (
        status IN ('IN_PROGRESS', 'ACHIEVED', 'FAILED')
    ),
    CONSTRAINT valid_target_date CHECK (
        target_date > CURRENT_DATE
    )
);

CREATE TRIGGER validate_savings_account
BEFORE INSERT OR UPDATE ON savings_goals
FOR EACH ROW EXECUTE FUNCTION check_valid_account();

CREATE INDEX idx_active_goals ON savings_goals(user_id, status) 
WHERE status = 'IN_PROGRESS';

-- Add dashboard configurations
CREATE TABLE dashboard_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    config_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add data export/import tracking
CREATE TABLE data_transfers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'EXPORT' or 'IMPORT'
    format VARCHAR(10) NOT NULL, -- 'CSV' or 'XLSX'
    status VARCHAR(20) NOT NULL,
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_transfer_type CHECK (type IN ('EXPORT', 'IMPORT')),
    CONSTRAINT valid_transfer_format CHECK (format IN ('CSV', 'XLSX')),
    CONSTRAINT valid_transfer_status CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

-- Add user activity logging
CREATE TABLE user_activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_entity_type CHECK (
        entity_type IN (
            'EXPENSE',
            'BUDGET',
            'GROUP',
            'VIRTUAL_ACCOUNT',
            'SAVINGS_GOAL',
            'SPLIT_EXPENSE',
            'USER_PREFERENCE',
            'CATEGORY',
            'TAG'
        )
    )
);

-- Add indexes for new tables
CREATE INDEX idx_dashboard_configs_user ON dashboard_configurations(user_id);
CREATE INDEX idx_data_transfers_user ON data_transfers(user_id, status);
CREATE INDEX idx_user_activity_logs ON user_activity_logs(user_id, created_at);
CREATE INDEX idx_user_activity_entity ON user_activity_logs(entity_type, entity_id);