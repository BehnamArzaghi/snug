-- Enable the pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add search index to messages table
CREATE INDEX IF NOT EXISTS idx_messages_content_gin 
ON messages USING gin(content gin_trgm_ops);

-- Drop existing function
DROP FUNCTION IF EXISTS search_messages(text,uuid,integer,integer);

-- Add search function
CREATE OR REPLACE FUNCTION search_messages(
  p_search_query TEXT,
  p_channel_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  user_id UUID,
  channel_id UUID,
  context_before JSON,
  context_after JSON,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_messages AS (
    SELECT 
      m.id,
      m.content,
      m.created_at,
      m.user_id,
      m.channel_id,
      similarity(m.content, p_search_query) as similarity
    FROM messages m
    WHERE 
      m.channel_id = p_channel_id
      AND m.created_at > NOW() - INTERVAL '30 days'
      AND similarity(m.content, p_search_query) > 0.3
    ORDER BY similarity DESC, created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  ),
  context AS (
    SELECT 
      mm.id,
      mm.content,
      mm.created_at,
      mm.user_id,
      mm.channel_id,
      mm.similarity,
      (
        SELECT json_agg(context_before.*)
        FROM (
          SELECT 
            m.id,
            m.content,
            m.created_at,
            m.user_id,
            m.channel_id
          FROM messages m
          WHERE m.channel_id = mm.channel_id
            AND m.created_at < mm.created_at
          ORDER BY m.created_at DESC
          LIMIT 1
        ) context_before
      ) as context_before,
      (
        SELECT json_agg(context_after.*)
        FROM (
          SELECT 
            m.id,
            m.content,
            m.created_at,
            m.user_id,
            m.channel_id
          FROM messages m
          WHERE m.channel_id = mm.channel_id
            AND m.created_at > mm.created_at
          ORDER BY m.created_at ASC
          LIMIT 1
        ) context_after
      ) as context_after
    FROM matched_messages mm
  )
  SELECT 
    id,
    content,
    created_at,
    user_id,
    channel_id,
    context_before,
    context_after,
    similarity
  FROM context;
END;
$$ LANGUAGE plpgsql; 