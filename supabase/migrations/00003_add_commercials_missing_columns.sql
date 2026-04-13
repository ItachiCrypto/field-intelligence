-- Add missing columns to commercials table
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS cr_week int DEFAULT 0;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS useful_signals int DEFAULT 0;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS active_alerts int DEFAULT 0;

-- Add missing columns to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS active_signals int DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kam_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health text DEFAULT 'vert';
