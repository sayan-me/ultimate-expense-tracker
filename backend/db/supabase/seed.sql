-- Default Categories
INSERT INTO categories (name, description, is_default) VALUES
('Food & Dining', 'Restaurants, cafes, and food delivery', true),
('Groceries', 'Supermarket and grocery shopping', true),
('Transportation', 'Public transport, fuel, and ride-sharing', true),
('Shopping', 'Clothing, electronics, and general retail', true),
('Bills & Utilities', 'Electricity, water, internet, and phone bills', true),
('Entertainment', 'Movies, games, and recreational activities', true),
('Health', 'Medical expenses and healthcare', true),
('Education', 'Courses, books, and learning materials', true);

-- Default Tags
INSERT INTO tags (name, description, is_default) VALUES
('Essential', 'Necessary expenses', true),
('Non-Essential', 'Optional or luxury expenses', true),
('Business', 'Work-related expenses', true),
('Personal', 'Personal expenses', true),
('Investment', 'Investment-related expenses', true),
('Shared', 'Expenses shared with others', true),
('Recurring', 'Regular monthly expenses', true),
('One-time', 'Non-recurring expenses', true),
('Work-related', 'Professional expenses', true),
('Family', 'Family-related expenses', true);

-- All Users
INSERT INTO users (name, email) VALUES
('John Doe', 'john@example.com'),
('Jane Smith', 'jane@example.com'),
('Bob Wilson', 'bob@example.com'),
('Alice Johnson', 'alice@example.com'),
('Charlie Brown', 'charlie@example.com'),
('David Miller', 'david@example.com'),
('Eva Garcia', 'eva@example.com'),
('Frank Lee', 'frank@example.com'),
('Grace Kim', 'grace@example.com'),
('Henry Wilson', 'henry@example.com'),
('Ivy Chen', 'ivy@example.com'),
('Jack Taylor', 'jack@example.com'),
('Kelly Martinez', 'kelly@example.com');

-- All Bank Accounts
INSERT INTO bank_accounts (user_id, account_name, account_number, bank_name) VALUES
(1, 'Primary Checking', '1234567890', 'Chase Bank'),
(1, 'Savings Account', '0987654321', 'Chase Bank'),
(2, 'Main Account', '1122334455', 'Bank of America'),
(3, 'Salary Account', '5544332211', 'Wells Fargo'),
(4, 'Primary Account', '2233445566', 'Citibank'),
(5, 'Checking Account', '3344556677', 'Wells Fargo'),
(6, 'Main Account', '4455667788', 'Bank of America'),
(7, 'Savings Account', '5566778899', 'Chase Bank');

-- All Virtual Accounts
INSERT INTO virtual_accounts (user_id, name, description, balance, account_type) VALUES
(1, 'Emergency Fund', 'For unexpected expenses', 5000.00, 'savings'),
(1, 'Car Loan', 'Auto loan payments', 15000.00, 'loan'),
(2, 'House Down Payment', 'Saving for house', 25000.00, 'savings'),
(3, 'Travel Fund', 'Vacation savings', 2500.00, 'savings'),
(4, 'Daily Expenses', 'Regular spending account', 3000.00, 'savings'),
(4, 'Car Loan', 'Auto loan payments', 20000.00, 'loan'),
(5, 'Emergency Fund', 'Rainy day fund', 5000.00, 'savings'),
(6, 'Student Loan', 'Education loan', 15000.00, 'loan'),
(7, 'Travel Fund', 'Vacation savings', 2000.00, 'savings');

-- All Virtual Bank Mappings
INSERT INTO virtual_bank_mappings (virtual_account_id, bank_account_id) VALUES
(1, 1),
(2, 1),
(3, 3),
(4, 4),
(5, 4),
(6, 4),
(7, 5);

-- All User Preferences
INSERT INTO user_preferences (user_id, push_notifications_enabled, expense_reminder_frequency, theme_preference, currency_code) VALUES
(1, true, 'DAILY', 'DARK', 'USD'),
(2, true, 'WEEKLY', 'SYSTEM', 'USD'),
(3, true, 'MONTHLY', 'DARK', 'USD'),
(4, true, 'WEEKLY', 'DARK', 'USD'),
(5, true, 'DAILY', 'LIGHT', 'USD'),
(6, false, 'NEVER', 'SYSTEM', 'USD'),
(7, true, 'MONTHLY', 'DARK', 'USD'),
(8, true, 'WEEKLY', 'DARK', 'USD'),
(9, true, 'DAILY', 'LIGHT', 'USD'),
(10, true, 'WEEKLY', 'SYSTEM', 'USD'),
(11, true, 'DAILY', 'DARK', 'USD'),
(12, true, 'MONTHLY', 'DARK', 'USD'),
(13, true, 'WEEKLY', 'LIGHT', 'USD');

-- All Groups
INSERT INTO groups (name, description, owner_id, expense_limit) VALUES
('Roommates 2024', 'Shared apartment expenses', 1, 1000.00),
('Family Budget', 'Family expense tracking', 4, 5000.00),
('Travel Group', 'Annual vacation planning', 7, 2000.00),
('Office Lunch Group', 'Team lunch expenses', 2, 500.00);

-- All Group Members
INSERT INTO group_members (group_id, user_id, is_owner) VALUES
-- Roommates Group
(1, 1, true),  -- John (owner)
(1, 2, true),  -- Jane (co-owner)
(1, 3, false), -- Bob
(1, 4, false), -- Alice
-- Family Budget
(2, 4, true),  -- Alice (owner)
(2, 5, true),  -- Charlie (co-owner)
(2, 6, false), -- David
(2, 7, false), -- Eva
(2, 8, false), -- Frank
-- Travel Group
(3, 7, true),  -- Henry (owner)
(3, 8, true),  -- Ivy (co-owner)
(3, 9, false), -- Jack
(3, 10, false),-- Kelly
(3, 1, false), -- John
-- Office Lunch
(4, 2, true),  -- Jane (owner)
(4, 3, false), -- Bob
(4, 4, false), -- Alice
(4, 5, false), -- Charlie
(4, 6, false); -- David

-- All Budgets
-- Personal Budgets (group_id is NULL)
INSERT INTO budgets (user_id, category_id, amount, start_date, end_date) VALUES
(1, 1, 500.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(1, 2, 300.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(2, 3, 200.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(3, 4, 400.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month');

-- Group Budgets
INSERT INTO budgets (group_id, category_id, amount, start_date, end_date) VALUES
(1, 1, 1000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(1, 7, 500.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(2, 2, 2000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month'),
(3, 6, 1500.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month');

-- All Expenses
INSERT INTO expenses (user_id, amount, description, date, merchant_name, virtual_account_id, category_id, is_recurring) VALUES
(1, 50.00, 'Grocery shopping', CURRENT_TIMESTAMP - INTERVAL '2 days', 'Whole Foods', 1, 2, false),
(1, 25.00, 'Netflix subscription', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Netflix', 1, 6, true),
(2, 35.00, 'Lunch with colleagues', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Local Cafe', 3, 1, false),
(3, 100.00, 'Monthly internet bill', CURRENT_TIMESTAMP, 'ISP Corp', 4, 5, true),
(4, 75.00, 'Team Lunch', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Chipotle', 5, 1, false),
(5, 150.00, 'Monthly Gym', CURRENT_TIMESTAMP, 'FitnessPro', 7, 7, true),
(6, 200.00, 'Online Course', CURRENT_TIMESTAMP - INTERVAL '5 days', 'Udemy', 8, 8, false),
(7, 45.00, 'Movie Night', CURRENT_TIMESTAMP - INTERVAL '2 days', 'AMC Theaters', 9, 6, false),
(4, 60.00, 'Phone Bill', CURRENT_TIMESTAMP, 'Verizon', 5, 5, true),
(5, 30.00, 'Bus Pass', CURRENT_TIMESTAMP, 'Metro Transit', 7, 3, true),
(6, 250.00, 'Dentist Visit', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Smile Dental', 8, 7, false),
(7, 80.00, 'Work Supplies', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Office Depot', 9, 4, false);

-- All Split Expenses
INSERT INTO split_expenses (group_id, expense_id, total_amount, split_type, status, created_by_user_id) VALUES
(1, 1, 120.00, 'EQUAL', 'PENDING', 1),
(1, 2, 200.00, 'EQUAL', 'APPROVED', 2),
(2, 3, 500.00, 'PERCENTAGE', 'PENDING', 4),
(3, 4, 300.00, 'CUSTOM', 'APPROVED', 7),
(4, 5, 75.00, 'EQUAL', 'PENDING', 2),
(2, 7, 200.00, 'PERCENTAGE', 'PENDING', 4);

-- All Split Expense Shares
INSERT INTO split_expense_shares (split_expense_id, user_id, amount, percentage, status) VALUES
-- Roommates dinner (equal split)
(1, 1, 30.00, 25, 'PENDING'),
(1, 2, 30.00, 25, 'PENDING'),
(1, 3, 30.00, 25, 'PENDING'),
(1, 4, 30.00, 25, 'PENDING'),
-- Family grocery (percentage split)
(2, 4, 100.00, 50, 'PAID'),
(2, 5, 60.00, 30, 'PAID'),
(2, 6, 40.00, 20, 'PENDING');

-- All Loan Installments
INSERT INTO loan_installments (virtual_account_id, amount, due_date, is_paid, reminder_days) VALUES
(2, 500.00, CURRENT_DATE + INTERVAL '1 month', false, 5),
(2, 500.00, CURRENT_DATE + INTERVAL '2 months', false, 5);

-- All Savings Goals
INSERT INTO savings_goals (user_id, virtual_account_id, name, target_amount, current_amount, target_date, status) VALUES
(1, 1, 'Emergency Fund Goal', 10000.00, 5000.00, CURRENT_DATE + INTERVAL '6 months', 'IN_PROGRESS'),
(2, 3, 'House Down Payment', 50000.00, 25000.00, CURRENT_DATE + INTERVAL '1 year', 'IN_PROGRESS');

-- All Expense Tags Mapping
INSERT INTO expense_tags (expense_id, tag_id) VALUES
(1, 1), -- Grocery shopping - Essential
(1, 3), -- Grocery shopping - Personal
(2, 2), -- Netflix - Non-Essential
(2, 5), -- Netflix - Recurring
(3, 1), -- Lunch - Essential
(3, 4), -- Lunch - Work-related
(4, 2), -- Internet - Non-Essential
(4, 5), -- Internet - Recurring
(5, 1), -- Team Lunch - Essential
(5, 3), -- Team Lunch - Work-related
(5, 6), -- Team Lunch - Shared
(6, 2), -- Gym - Non-Essential
(6, 7), -- Gym - Recurring
(7, 2), -- Online Course - Non-Essential
(7, 8), -- Online Course - Work-related
(8, 2), -- Movie Night - Non-Essential
(8, 8), -- Movie Night - One-time
(9, 1), -- Phone Bill - Essential
(9, 7), -- Phone Bill - Recurring
(10, 1), -- Bus Pass - Essential
(10, 7), -- Bus Pass - Recurring
(11, 1), -- Dentist - Essential
(11, 8), -- Dentist - One-time
(12, 3), -- Work Supplies - Work-related
(12, 8); -- Work Supplies - One-time

-- Dashboard Configurations
INSERT INTO dashboard_configurations (user_id, name, config_data, is_default) VALUES
(1, 'Default View', '{"widgets": ["expenses", "savings", "budget"]}', true),
(2, 'Minimal View', '{"widgets": ["expenses", "budget"]}', true);

-- Add sample Data Transfers
INSERT INTO data_transfers (user_id, type, format, status, file_url) VALUES
(1, 'EXPORT', 'CSV', 'COMPLETED', 'https://storage.example.com/exports/user1_export.csv'),
(2, 'IMPORT', 'XLSX', 'COMPLETED', 'https://storage.example.com/imports/user2_import.xlsx');

-- Add sample User Activity Logs
INSERT INTO user_activity_logs (user_id, activity_type, entity_type, entity_id, changes) VALUES
(1, 'CREATE', 'EXPENSE', 1, '{"amount": 50.00, "description": "Grocery shopping"}'),
(2, 'UPDATE', 'BUDGET', 1, '{"amount": {"old": 400.00, "new": 500.00}}'),
(3, 'DELETE', 'SPLIT_EXPENSE', 2, '{"total_amount": 200.00}');