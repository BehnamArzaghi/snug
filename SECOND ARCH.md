# Snug - Minimalist Real-time Chat MVP

This document outlines a simplified approach to building a Slack-like MVP with minimal complexity, designed for implementation by a single developer on one laptop.

## 1. Product Requirements Document (PRD)

### 1.1 Project Overview

**Goal**: Create a functional real-time chat platform with essential Slack-like features, prioritizing simplicity and speed of implementation.

**Core Features** (MVP Only):
1. User authentication (email/password via Supabase Auth)
2. Channels (public/private)
3. Real-time messaging
4. Basic file sharing (images only)
5. Simple presence (online/offline)
6. Basic message search

**Explicitly Excluded from MVP**:
- Message threading
- Message editing/deletion
- Reactions
- Typing indicators
- User roles beyond owner/member
- Message status tracking
- Complex permissions

### 1.2 Constraints & Assumptions

1. **Single Developer Setup**:
   - One laptop
   - One development environment
   - No complex branching or CI/CD

2. **Technology Choices**:
   - Next.js for frontend and API routes
   - Supabase for all backend needs
   - Drizzle (optional) for type-safe queries

3. **Timeline**:
   - 1 week to basic functionality
   - 1 week for refinement and deployment

### 1.3 Success Criteria
- Users can sign up and log in
- Users can create and join channels
- Messages deliver in real-time
- Images can be shared
- Basic search works
- Deployment is stable on Vercel

## 2. Technical Design Document (TDD)

### 2.1 System Architecture

```
+-------------------+          +-------------------------+
|                   |          |                         |
|  Next.js App      |  <--->   |  Supabase              |
|  - Pages          |          |  - Auth                |
|  - API Routes     |          |  - Database            |
|  - Components     |          |  - Storage             |
|                   |          |  - Realtime            |
+-------------------+          +-------------------------+
```

### 2.2 Core Functionality

1. **Authentication**:
   ```typescript
   // Simple auth hook
   const useAuth = () => {
     const [user, setUser] = useState<User | null>(null);
     
     useEffect(() => {
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (_, session) => setUser(session?.user ?? null)
       );
       return () => subscription.unsubscribe();
     }, []);

     return user;
   };
   ```

2. **Real-time Messages**:
   ```typescript
   // Simple channel subscription
   const useChannelMessages = (channelId: string) => {
     useEffect(() => {
       const channel = supabase
         .channel(`channel-${channelId}`)
         .on('INSERT', 'messages', handleNewMessage)
         .subscribe();

       return () => {
         channel.unsubscribe();
       };
     }, [channelId]);
   };
   ```

3. **File Uploads**:
   ```typescript
   const uploadFile = async (file: File) => {
     if (!FILE_CONFIG.allowedTypes.includes(file.type)) {
       throw new Error('Unsupported file type');
     }
     
     const path = `${Date.now()}-${file.name}`;
     const { data, error } = await supabase.storage
       .from('files')
       .upload(path, file);
     
     return data?.path;
   };
   ```

### 2.3 Data Model

```typescript
// Minimal schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email').notNull().unique(),
  name: varchar('name').notNull(),
  lastSeen: timestamp('last_seen').defaultNow(),
});

export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  isPrivate: boolean('is_private').default(false),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  channelId: integer('channel_id').notNull(),
  userId: integer('user_id').notNull(),
  fileUrl: varchar('file_url'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 2.4 Configuration

```typescript
// Essential configs only
export const CONFIG = {
  files: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png'],
  },
  messages: {
    maxLength: 4000,
    searchLimit: 20,
  },
  presence: {
    updateInterval: 60_000, // 1 minute
    offlineThreshold: 2 * 60_000, // 2 minutes
  },
} as const;
```

### 2.2 Core Technical Decisions

1. **Routing Strategy** (Added: Jan 7, 2024)
   - Using Next.js Pages Router (`/pages` directory) instead of App Router
   - Rationale:
     - Better TypeScript support for MVP phase
     - More mature ecosystem
     - Simpler mental model for authentication flows
     - Reduced complexity for MVP features
   - Trade-offs:
     - No server components (not needed for MVP)
     - Will require migration if advanced App Router features needed later

2. **Technology Choices**:
   - Next.js for frontend and API routes
   - Supabase for all backend needs
   - Direct Supabase queries (no ORM for simplicity)
   - shadcn/ui for component library

## 3. Implementation Guide

### 3.1 Project Setup

1. Create Next.js project:
```bash
npx create-next-app@latest snug --typescript --tailwind
cd snug
```

2. Add dependencies:
```bash
npm install @supabase/supabase-js drizzle-orm
```

3. Environment setup:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 Core Components

```typescript
// pages/_app.tsx
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

// pages/index.tsx
const HomePage = () => (
  <div className="flex h-screen">
    <ChannelList className="w-64 border-r" />
    <ChatArea className="flex-1" />
  </div>
);

// components/ChatArea.tsx
const ChatArea = () => {
  const messages = useChannelMessages(channelId);
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
};
```

### 3.3 API Routes

```typescript
// pages/api/messages/[channelId].ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { channelId } = req.query;
  
  const messages = await supabase
    .from('messages')
    .select('*')
    .eq('channelId', channelId)
    .order('createdAt', { ascending: false })
    .limit(50);
    
  res.json(messages);
}
```

### 3.4 Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## 4. Development Workflow

1. **Local Development**:
   ```bash
   npm run dev
   ```

2. **Testing**:
   - Manual testing of core flows
   - Two browser windows for real-time testing

3. **Deployment**:
   - Push to main branch
   - Vercel auto-deploys

## Conclusion

This simplified architecture enables rapid MVP development by:
1. Focusing on essential features only
2. Using Supabase for all backend needs
3. Minimizing configuration and complexity
4. Providing clear implementation path

The result is a functional chat application that can be built by one developer in 2 weeks or less.

# UI Component Architecture

## Message Components

### Base Components
We utilize shadcn-chat's UI components with our own real-time backend:

```typescript
// Component Hierarchy
MessageList (Our Container)
└─ ChatBubble (shadcn-chat)
   ├─ ChatBubbleAvatar
   ├─ ChatBubbleMessage
   └─ ChatBubbleTimestamp

MessageInput (Our Container)
└─ ChatInput (shadcn-chat)
```

### Dependencies
Required base components and utilities:
```bash
# Core Dependencies
@radix-ui/react-avatar    # Avatar primitives
@radix-ui/react-slot      # Component composition
class-variance-authority  # Style variants
clsx                     # Class utilities
tailwind-merge          # Style merging

# UI Components
- avatar.tsx    # User avatars
- button.tsx    # Action buttons
- utils.ts      # Style utilities
```

### Integration Strategy
We chose a hybrid approach:
1. Keep our Supabase real-time logic
2. Use shadcn-chat for UI components
3. Maintain separation of concerns:
   - Our components: Data and state management
   - shadcn-chat: UI presentation

### Benefits
1. Consistent design language
2. Accessible components
3. Type-safe props
4. Maintainable structure

### Performance Considerations
1. Components are tree-shakeable
2. Styles are optimized via Tailwind
3. Real-time updates minimize re-renders