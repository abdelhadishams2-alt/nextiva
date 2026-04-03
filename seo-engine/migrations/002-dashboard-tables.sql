-- ChainIQ Dashboard Tables Migration
-- Run this in Supabase SQL Editor after supabase-setup.sql

-- ── Articles ──
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    framework VARCHAR(50) DEFAULT 'html',
    status VARCHAR(20) DEFAULT 'draft',
    file_path TEXT,
    word_count INTEGER,
    image_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own articles" ON articles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own articles" ON articles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own articles" ON articles FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- ── Article Versions ──
CREATE TABLE IF NOT EXISTS article_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    section_edited TEXT,
    content_snapshot TEXT,
    word_count_delta INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, version_number)
);

ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own versions" ON article_versions FOR SELECT
    USING (article_id IN (SELECT id FROM articles WHERE user_id = auth.uid()));

CREATE INDEX idx_article_versions_article_id ON article_versions(article_id);

-- ── Pipeline Jobs ──
CREATE TABLE IF NOT EXISTS pipeline_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    article_id UUID REFERENCES articles(id),
    topic TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    framework VARCHAR(50) DEFAULT 'html',
    status VARCHAR(20) DEFAULT 'queued',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own jobs" ON pipeline_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own jobs" ON pipeline_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_pipeline_jobs_user_id ON pipeline_jobs(user_id);
CREATE INDEX idx_pipeline_jobs_status ON pipeline_jobs(status);
