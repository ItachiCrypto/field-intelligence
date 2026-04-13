-- Add missing columns to commercials table
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS cr_week int DEFAULT 0;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS useful_signals int DEFAULT 0;
ALTER TABLE commercials ADD COLUMN IF NOT EXISTS active_alerts int DEFAULT 0;

-- Add missing columns to accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS active_signals int DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kam_name text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health text DEFAULT 'vert';

-- Add missing columns to alerts table (for denormalized signal data)
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS content text;

-- Populate cr_week with realistic demo values for existing commercials
UPDATE commercials SET cr_week = floor(random() * 8 + 5)::int WHERE cr_week = 0 OR cr_week IS NULL;
UPDATE commercials SET useful_signals = floor(random() * 6 + 1)::int WHERE useful_signals = 0 OR useful_signals IS NULL;

-- Populate accounts missing fields
UPDATE accounts SET active_signals = floor(random() * 4)::int WHERE active_signals = 0 OR active_signals IS NULL;
UPDATE accounts SET health = CASE
  WHEN risk_score >= 60 THEN 'rouge'
  WHEN risk_score >= 30 THEN 'orange'
  WHEN risk_score >= 15 THEN 'jaune'
  ELSE 'vert'
END WHERE health = 'vert' OR health IS NULL;

-- Populate alert content from joined signals
UPDATE alerts SET
  client_name = s.client_name,
  content = s.content
FROM signals s
WHERE alerts.signal_id = s.id
AND (alerts.client_name IS NULL OR alerts.content IS NULL);
