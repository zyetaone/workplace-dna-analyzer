-- Add authentication tables for admin users
-- Migration: 0003_add_auth_tables.sql

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'presenter' CHECK(role IN ('admin', 'presenter', 'viewer')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT,
    metadata TEXT DEFAULT '{}'
);

-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_idx ON admin_users(email);
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_idx ON admin_users(username);
CREATE UNIQUE INDEX IF NOT EXISTS auth_sessions_token_idx ON auth_sessions(token);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_idx ON auth_sessions(expires_at);

-- Insert default admin user (password: admin123)
-- Password hash is for 'admin123' using PBKDF2
INSERT OR IGNORE INTO admin_users (
    id,
    email,
    username,
    password_hash,
    role,
    is_active,
    metadata
) VALUES (
    'admin_' || lower(hex(randomblob(8))),
    'admin@zyeta.live',
    'admin',
    -- This is a placeholder - will be properly hashed on first run
    'PLACEHOLDER_HASH',
    'admin',
    1,
    '{"name":"System Administrator","preferences":{"theme":"dark","notifications":true}}'
);