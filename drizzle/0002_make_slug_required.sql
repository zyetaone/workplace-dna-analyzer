-- Migration: Make slug column required and populate existing sessions
-- Step 1: Create temporary table with required slug
CREATE TABLE sessions_new (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT
);

-- Step 2: Populate new table with slugs generated from names
INSERT INTO sessions_new (id, code, name, slug, is_active, created_at, ended_at)
SELECT 
    id, 
    code, 
    name,
    CASE 
        WHEN slug IS NOT NULL AND slug != '' THEN slug
        ELSE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(name, ' ', '-'), '/', '-'), '(', ''), ')', '')) || '-' || SUBSTR(id, 1, 8)
    END as slug,
    is_active,
    created_at,
    ended_at
FROM sessions;

-- Step 3: Drop old table
DROP TABLE sessions;

-- Step 4: Rename new table
ALTER TABLE sessions_new RENAME TO sessions;

-- Update any duplicate slugs by appending session ID suffix
UPDATE sessions 
SET slug = slug || '-' || SUBSTR(id, 1, 8)
WHERE id IN (
    SELECT s1.id 
    FROM sessions s1 
    JOIN sessions s2 ON s1.slug = s2.slug AND s1.id != s2.id
);
