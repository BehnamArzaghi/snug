-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all users
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

-- Users can update their own record
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Channels are readable by everyone
CREATE POLICY "Channels are viewable by everyone" ON channels
    FOR SELECT USING (true);

-- Anyone can create public channels
CREATE POLICY "Anyone can create public channels" ON channels
    FOR INSERT WITH CHECK (NOT is_private);

-- Messages are readable by everyone
CREATE POLICY "Messages are viewable by everyone" ON messages
    FOR SELECT USING (true);

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can insert messages" ON messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages; 