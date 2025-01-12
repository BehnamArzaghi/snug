-- Insert dummy users into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('d0d8c19c-1c6f-4d22-8e0f-f2c3f2b6c122', 'alice@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('e1e9c29d-2d7f-5e33-9f1f-f3d4f3c7d233', 'bob@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('f2f0d30e-3e8f-6f44-0f2f-f4e5f4d8e344', 'charlie@test.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding entries in public.users
INSERT INTO public.users (id, email, name, created_at)
VALUES
  ('d0d8c19c-1c6f-4d22-8e0f-f2c3f2b6c122', 'alice@test.com', 'Alice Admin', NOW()),
  ('e1e9c29d-2d7f-5e33-9f1f-f3d4f3c7d233', 'bob@test.com', 'Bob Builder', NOW()),
  ('f2f0d30e-3e8f-6f44-0f2f-f4e5f4d8e344', 'charlie@test.com', 'Charlie Chan', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create a test channel
INSERT INTO public.channels (id, name, is_private, created_at)
VALUES
  ('a1a1b2b2-c3c3-d4d4-e5e5-f6f6f7f7f8f8', 'test-private-channel', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Make Alice an admin of the test channel
INSERT INTO public.channel_members (channel_id, user_id, role, created_at)
VALUES
  ('a1a1b2b2-c3c3-d4d4-e5e5-f6f6f7f7f8f8', 'd0d8c19c-1c6f-4d22-8e0f-f2c3f2b6c122', 'admin', NOW())
ON CONFLICT (channel_id, user_id) DO NOTHING; 