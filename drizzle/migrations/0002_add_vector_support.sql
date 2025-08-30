-- Migration: Add Vector Support to Zyeta Database
-- Description: Adds vector columns and new tables for AI-powered features
-- Author: Zyeta Development Team
-- Date: 2024-01-01

-- ============================================================================
-- STEP 1: Add Vector Columns to Existing Tables
-- ============================================================================

-- Add embedding support to sessions table
ALTER TABLE sessions ADD COLUMN embedding TEXT; -- JSON array of floats
ALTER TABLE sessions ADD COLUMN embedding_model TEXT DEFAULT 'text-embedding-ada-002';
ALTER TABLE sessions ADD COLUMN ai_insights TEXT; -- JSON object
ALTER TABLE sessions ADD COLUMN description TEXT;
ALTER TABLE sessions ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Add response embedding to participants table
ALTER TABLE participants ADD COLUMN response_embedding TEXT; -- JSON array of floats

-- ============================================================================
-- STEP 2: Create Vector Storage Tables
-- ============================================================================

-- Documents table for file storage with embeddings
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT CHECK(content_type IN ('markdown', 'json', 'text', 'csv')) NOT NULL,
    embedding TEXT, -- JSON array for vector
    embedding_model TEXT DEFAULT 'text-embedding-ada-002',
    parent_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER,
    total_chunks INTEGER,
    metadata TEXT, -- JSON object
    uploaded_by TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at TEXT
);

-- Knowledge base for RAG
CREATE TABLE IF NOT EXISTS knowledge_base (
    id TEXT PRIMARY KEY,
    category TEXT CHECK(category IN ('workplace', 'generation', 'preferences', 'trends', 'research')) NOT NULL,
    subcategory TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    embedding TEXT, -- JSON array for vector
    embedding_model TEXT DEFAULT 'text-embedding-ada-002',
    source TEXT,
    source_url TEXT,
    author TEXT,
    published_date TEXT,
    relevance_score REAL DEFAULT 1.0,
    quality_score REAL DEFAULT 1.0,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Search queries cache
CREATE TABLE IF NOT EXISTS search_queries (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    query_type TEXT CHECK(query_type IN ('semantic', 'keyword', 'hybrid', 'rag')) NOT NULL,
    query_embedding TEXT, -- JSON array for vector
    results TEXT, -- JSON object
    result_count INTEGER DEFAULT 0,
    execution_time REAL,
    cached INTEGER DEFAULT 0 CHECK(cached IN (0, 1)),
    user_id TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- AI conversation history
CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,
    parent_id TEXT REFERENCES ai_conversations(id),
    role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    context_used TEXT, -- JSON array
    embedding TEXT, -- JSON array for vector
    model TEXT DEFAULT 'gpt-4',
    temperature REAL,
    max_tokens INTEGER,
    completion_tokens INTEGER,
    prompt_tokens INTEGER,
    total_cost REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- STEP 3: Create Indexes for Performance
-- ============================================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_cookie ON participants(cookie_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);

-- Knowledge base indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_title ON knowledge_base(title);
CREATE INDEX IF NOT EXISTS idx_knowledge_relevance ON knowledge_base(relevance_score DESC);

-- Search queries indexes
CREATE INDEX IF NOT EXISTS idx_search_session ON search_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_search_query ON search_queries(query);
CREATE INDEX IF NOT EXISTS idx_search_created ON search_queries(created_at DESC);

-- AI conversations indexes
CREATE INDEX IF NOT EXISTS idx_ai_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_thread ON ai_conversations(thread_id);
CREATE INDEX IF NOT EXISTS idx_ai_parent ON ai_conversations(parent_id);

-- ============================================================================
-- STEP 4: Create Vector Search Functions (LibSQL/Turso specific)
-- ============================================================================

-- Note: LibSQL/Turso automatically provides vector functions when using VECTOR type
-- For now, we're using TEXT (JSON) for embeddings, but can upgrade to VECTOR type later

-- Helper view for session analytics with embeddings
CREATE VIEW IF NOT EXISTS session_analytics AS
SELECT 
    s.id,
    s.code,
    s.name,
    s.description,
    s.is_active,
    s.created_at,
    s.embedding IS NOT NULL as has_embedding,
    COUNT(DISTINCT p.id) as participant_count,
    COUNT(DISTINCT CASE WHEN p.completed = 1 THEN p.id END) as completed_count,
    COUNT(DISTINCT d.id) as document_count
FROM sessions s
LEFT JOIN participants p ON s.id = p.session_id
LEFT JOIN documents d ON s.id = d.session_id
GROUP BY s.id;

-- ============================================================================
-- STEP 5: Insert Default Knowledge Base Content
-- ============================================================================

-- Insert sample knowledge base entries
INSERT INTO knowledge_base (id, category, title, content, summary, relevance_score) VALUES
(
    'kb_001',
    'generation',
    'Millennial Workplace Preferences',
    'Millennials (born 1981-1996) prioritize flexibility, work-life balance, and purpose-driven work. They value collaborative environments, continuous learning opportunities, and regular feedback. Technology integration is essential, with preference for digital communication tools and remote work options.',
    'Key preferences of Millennial workers in modern workplaces',
    0.95
),
(
    'kb_002',
    'generation',
    'Gen Z Workplace Expectations',
    'Gen Z (born 1997-2012) seeks stability, mental health support, and social impact. They prefer clear career progression, diverse and inclusive environments, and hybrid work models. Digital natives who expect seamless technology and instant communication.',
    'Understanding Gen Z workplace needs and expectations',
    0.95
),
(
    'kb_003',
    'workplace',
    'Hybrid Work Models',
    'Hybrid work combines in-office and remote work, offering flexibility while maintaining collaboration. Best practices include clear communication protocols, designated collaboration days, and equitable experiences for all workers regardless of location.',
    'Implementing effective hybrid work strategies',
    0.90
),
(
    'kb_004',
    'preferences',
    'Collaboration vs Focus Space',
    'Modern workplaces balance open collaboration areas with quiet focus zones. Activity-based working allows employees to choose spaces based on task requirements. Key is providing variety: phone booths, huddle rooms, quiet zones, and social spaces.',
    'Balancing collaboration and individual work needs',
    0.85
),
(
    'kb_005',
    'trends',
    'Workplace Wellness Integration',
    'Wellness in workplace design includes ergonomic furniture, natural light, air quality, and biophilic elements. Mental wellness features: meditation rooms, quiet spaces, and stress-reduction zones. Physical wellness: standing desks, walking paths, fitness facilities.',
    'Integrating wellness into workplace design',
    0.88
);

-- ============================================================================
-- STEP 6: Create Triggers for Updated Timestamps
-- ============================================================================

-- Trigger to update sessions.updated_at
CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp 
AFTER UPDATE ON sessions
BEGIN
    UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update knowledge_base.updated_at
CREATE TRIGGER IF NOT EXISTS update_knowledge_timestamp 
AFTER UPDATE ON knowledge_base
BEGIN
    UPDATE knowledge_base SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

-- Verify tables exist
SELECT 'Documents table created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='documents');
SELECT 'Knowledge base table created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='knowledge_base');
SELECT 'Search queries table created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='search_queries');
SELECT 'AI conversations table created' as status WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='ai_conversations');

-- Verify indexes exist
SELECT 'Indexes created: ' || COUNT(*) as index_count FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';

-- Verify knowledge base has content
SELECT 'Knowledge base entries: ' || COUNT(*) as kb_count FROM knowledge_base;