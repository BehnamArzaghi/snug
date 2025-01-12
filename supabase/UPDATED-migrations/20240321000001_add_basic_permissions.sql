-- Basic schema permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;

-- Table permissions for postgres role (superuser)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

-- Table permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Table permissions for anonymous users (read-only access where needed)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables get the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO anon;

-- Specific grants for our core tables (in case the above wasn't sufficient)
GRANT ALL ON channels TO authenticated;
GRANT ALL ON channel_members TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON access_requests TO authenticated; 