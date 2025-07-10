-- Login History Table Schema for Supabase
-- This table tracks user login events for audit and analytics purposes

CREATE TABLE IF NOT EXISTS login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    firebase_id TEXT NOT NULL,
    login_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    login_method TEXT DEFAULT 'password',
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_login_history_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE
);

-- Create indexes separately (PostgreSQL syntax)
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_firebase_id ON login_history (firebase_id);
CREATE INDEX IF NOT EXISTS idx_login_history_timestamp ON login_history (login_timestamp DESC);

-- Enable Row Level Security
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert/select
CREATE POLICY "Service role can manage login history" ON login_history
    FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE login_history IS 'Tracks user login events for audit and analytics';
COMMENT ON COLUMN login_history.user_id IS 'References users.id';
COMMENT ON COLUMN login_history.firebase_id IS 'Firebase UID for the user';
COMMENT ON COLUMN login_history.login_timestamp IS 'When the login occurred';
COMMENT ON COLUMN login_history.ip_address IS 'Client IP address';
COMMENT ON COLUMN login_history.user_agent IS 'Client user agent string';
COMMENT ON COLUMN login_history.login_method IS 'Method used for login (password, oauth, etc)';
COMMENT ON COLUMN login_history.success IS 'Whether the login was successful';