-- Migration: Supabase RLS Update
-- This migration is wrapped in a transaction and can be rolled back
-- Modified to work with Supabase's permission model

BEGIN;

-- Validation checks before we start
DO $$
BEGIN
    -- Check if required tables exist (removed superuser check)
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channels') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'messages') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channel_members') OR
       NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users')
    THEN
        RAISE EXCEPTION 'Missing required tables. Please check your database structure.';
    END IF;
END $$;

-- Set correct schema
SET search_path TO public;

-- Store original RLS states for rollback validation
CREATE TEMPORARY TABLE _rls_states AS
SELECT 
    tablename,
    relrowsecurity as had_rls
FROM pg_tables
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE schemaname = 'public'
AND tablename IN ('channel_members', 'channels', 'messages');

[Rest of the migration remains exactly the same until the validation checks]

-- Validation checks after changes
DO $$
DECLARE
    policy_count int;
BEGIN
    -- Count new policies to ensure they were created
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('channel_members', 'channels', 'messages');

    IF policy_count < 10 THEN  -- We expect at least 10 policies
        RAISE EXCEPTION 'Not all policies were created successfully. Rolling back...';
    END IF;

    -- Verify RLS is enabled (modified check)
    IF EXISTS (
        SELECT 1 FROM pg_tables
        JOIN pg_class ON pg_tables.tablename = pg_class.relname
        WHERE schemaname = 'public'
        AND tablename IN ('channel_members', 'channels', 'messages')
        AND NOT relrowsecurity
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on all required tables. Rolling back...';
    END IF;
END $$;

-- To commit the changes, uncomment the next line and comment out ROLLBACK
-- COMMIT;

-- To rollback all changes, uncomment the next line and comment out COMMIT
ROLLBACK; 