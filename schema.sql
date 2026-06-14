-- SQL Migration for Supabase
-- Create the inextokenusage table

CREATE TABLE IF NOT EXISTS inextokenusage (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_name VARCHAR(255) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    input_tokens INT,
    output_tokens INT,
    total_tokens INT NOT NULL,
    cost NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering by date
CREATE INDEX IF NOT EXISTS idx_inextokenusage_created_at ON inextokenusage (created_at);

-- Enable Row Level Security (RLS) if needed, but for this demo we'll assume the anon key is used for testing.
-- ALTER TABLE inextokenusage ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access" ON inextokenusage FOR SELECT USING (true);
